<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\EnvoyerMailActionAssignee;
use App\Models\Action;
use App\Models\AnalyseIa;
use App\Models\CompteRendu;
use App\Models\Decision;
use App\Models\Organisation;
use App\Models\Reunion;
use App\Models\User;
use App\Services\ClaudeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Validation\Rule;

class CompteRenduController extends Controller
{
    private const S3_URL_TTL_MINUTES = 15;

    public function __construct(private readonly ClaudeService $claude) {}

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/reunions/{reunId}/compte-rendu
    // ─────────────────────────────────────────────────────────────────────────

   public function show(Request $request, int $reunId): JsonResponse
    {
        $user   = $request->user();
        $orgId  = $this->getOrgId($request);
        $reunion = $this->getReunion($reunId, $orgId);

        $cr = $reunion->compteRendu()
            ->with(['decisions', 'actions.user', 'analyseIa'])
            ->first();

        if (!$cr) {
            return response()->json(['data' => null]);
        }

        $formatted = $this->format($cr);

        // Filtrer les actions selon le rôle
        $roleId = (int) $user->appartenances()
            ->where('app_statut', 'actif')
            ->where('org_id', $orgId)
            ->value('role_id');

        $peutVoirTout = in_array($roleId, [1, 2, 3, 4, 6]); // Super Admin, Admin, Manager, Assistant, Directeur

        if (!$peutVoirTout) {
            $formatted['actions'] = collect($formatted['actions'])
                ->filter(fn ($a) => $a['user_id'] === $user->id)
                ->values()
                ->toArray();
        }

        return response()->json(['data' => $formatted]);
    }
    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/reunions/{reunId}/compte-rendu/generer
    // Appelle Claude et retourne le résultat SANS sauvegarder.
    // ─────────────────────────────────────────────────────────────────────────

    public function generer(Request $request, int $reunId): JsonResponse
    {
        $request->validate(['notes' => 'required|string|min:1|max:50000']);

        $reunion = $this->getReunion($reunId, $this->getOrgId($request));
        $notes   = $this->resolveNotes($request->notes, $reunion);

        $result = $this->claude->genererCompteRendu(
            notes: $notes,
            titre: $reunion->reun_titre ?? 'Réunion',
            date:  $reunion->reun_date  ?? now()->toDateString(),
        );

        return response()->json([
            'data'      => $result,
            'simulated' => empty(config('services.anthropic.key')),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/reunions/{reunId}/compte-rendu/sauvegarder
    // Persiste le CR validé en BDD + S3 et notifie les nouveaux assignés.
    // ─────────────────────────────────────────────────────────────────────────

    public function sauvegarder(Request $request, int $reunId): JsonResponse
    {
        $orgId = $this->getOrgId($request);

        $request->validate([
            'summary'         => 'required|string|max:5000',
            'decisions'       => 'array|max:50',
            'decisions.*'     => 'string|max:1000',
            'tasks'           => 'array|max:100',
            'tasks.*.title'   => 'required|string|max:500',
            'tasks.*.user_id' => [
                'nullable', 'integer',
                Rule::exists('appartenances', 'user_id')
                    ->where('org_id', $orgId)
                    ->where('app_statut', 'actif'),
            ],
            'tasks.*.due'     => 'nullable|date',
        ]);

        $reunion = $this->getReunion($reunId, $orgId);
        $orgSlug = $this->getOrgSlug($orgId);

        DB::transaction(function () use ($request, $reunion, $orgId, $orgSlug) {

            // 1. Créer ou mettre à jour le CR
            $cr = CompteRendu::updateOrCreate(
                ['reun_id' => $reunion->reun_id],
                ['cr_resume' => $request->summary, 'cr_date_creation' => now()]
            );

            // 2. Remplacer les décisions
            $cr->decisions()->delete();
            foreach ($request->decisions ?? [] as $index => $text) {
                Decision::create([
                    'cr_id'        => $cr->cr_id,
                    'dec_intitule' => $text,
                    'dec_ordre'    => $index + 1,
                ]);
            }

            // 3. Remplacer les actions
            // Mémoriser les assignations AVANT suppression pour détecter les nouveautés
            $previousAssignees = $cr->wasRecentlyCreated
                ? []
                : $cr->actions()->pluck('user_id', 'action_texte')->toArray();

            $cr->actions()->delete();

            foreach ($request->tasks ?? [] as $task) {
                $action = Action::create([
                    'cr_id'           => $cr->cr_id,
                    'action_texte'    => $task['title'],
                    'action_echeance' => $task['due'] ?? null,
                    'action_statut'   => 'todo',
                    'user_id'         => $task['user_id'] ?? null,
                ]);

                $this->notifyIfNewAssignee($action, $reunion, $task, $previousAssignees);
            }

            // 4. Tracer la génération IA
            AnalyseIa::updateOrCreate(
                ['cr_id' => $cr->cr_id],
                ['ia_modele' => config('services.anthropic.model'), 'ia_statut' => 'termine', 'org_id' => $orgId]
            );

            // 5. Archiver le snapshot JSON sur S3
            $this->archiveSnapshot($reunion, $orgSlug, $request->summary, $request->decisions ?? [], $request->tasks ?? [], $orgId);
        });

        return response()->json(['message' => 'Compte rendu enregistré.'], 201);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/reunions/{reunId}/compte-rendu/fichier
    // ─────────────────────────────────────────────────────────────────────────

    public function uploadFichier(Request $request, int $reunId): JsonResponse
    {
        $request->validate(['fichier' => 'required|file|mimes:pdf,docx,txt|max:20480']);

        $orgId   = $this->getOrgId($request);
        $orgSlug = $this->getOrgSlug($orgId);
        $reunion = $this->getReunion($reunId, $orgId);
        $file    = $request->file('fichier');
        $s3Key   = "tenants/{$orgSlug}/reunions/{$reunId}/sources/" . Str::uuid() . '.' . $file->getClientOriginalExtension();

        Storage::disk('s3')->put($s3Key, file_get_contents($file), 'private');

        CompteRendu::updateOrCreate(
            ['reun_id' => $reunion->reun_id],
            ['cr_fichier' => $s3Key, 'cr_date_creation' => now()]
        );

        return response()->json(['message' => 'Fichier uploadé.', 's3_key' => $s3Key], 201);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/reunions/{reunId}/compte-rendu/download
    // ─────────────────────────────────────────────────────────────────────────

    public function download(Request $request, int $reunId): JsonResponse
    {
        $orgId   = $this->getOrgId($request);
        $orgSlug = $this->getOrgSlug($orgId);
        $reunion = $this->getReunion($reunId, $orgId);
        $cr      = $reunion->compteRendu()->firstOrFail();

        abort_if(!$cr->cr_fichier, 404, 'Aucun fichier attaché.');
        abort_if(!str_starts_with($cr->cr_fichier, "tenants/{$orgSlug}/"), 403, 'Accès non autorisé.');

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('s3');
        $url  = $disk->temporaryUrl($cr->cr_fichier, now()->addMinutes(self::S3_URL_TTL_MINUTES));

        return response()->json(['url' => $url]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /api/reunions/{reunId}/compte-rendu
    // ─────────────────────────────────────────────────────────────────────────

    public function destroy(Request $request, int $reunId): JsonResponse
    {
        $orgId   = $this->getOrgId($request);
        $orgSlug = $this->getOrgSlug($orgId);
        $reunion = $this->getReunion($reunId, $orgId);
        $cr      = $reunion->compteRendu()->firstOrFail();

        DB::transaction(function () use ($cr, $orgSlug, $reunId) {

            if ($cr->cr_fichier) {
                abort_if(!str_starts_with($cr->cr_fichier, "tenants/{$orgSlug}/"), 403, 'Accès non autorisé au fichier source.');
                $this->deleteFromS3($cr->cr_fichier);
            }

            $this->deleteFromS3("tenants/{$orgSlug}/reunions/{$reunId}/compte-rendus/cr.json");

            $cr->decisions()->delete();
            $cr->actions()->delete();
            $cr->analyseIa()->delete();
            $cr->delete();
        });

        return response()->json(['message' => 'Compte rendu supprimé.']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers privés
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Si les notes sont un placeholder PDF, extraire le vrai texte depuis S3.
     */
    private function resolveNotes(string $notes, Reunion $reunion): string
    {
        if (!str_starts_with(trim($notes), '[PDF :')) {
            return $notes;
        }

        $cr = $reunion->compteRendu()->first();

        if (!$cr?->cr_fichier || !Storage::disk('s3')->exists($cr->cr_fichier)) {
            return $notes;
        }

        try {
            $extracted = trim((new \Smalot\PdfParser\Parser())
                ->parseContent(Storage::disk('s3')->get($cr->cr_fichier))
                ->getText());

            return !empty($extracted) ? $extracted : $notes;
        } catch (\Exception) {
            return $notes;
        }
    }

    /**
     * Dispatcher un mail si l'assigné d'une action a changé.
     */
    private function notifyIfNewAssignee(Action $action, Reunion $reunion, array $task, array $previousAssignees): void
    {
        $newUserId  = $task['user_id'] ?? null;
        $prevUserId = $previousAssignees[$task['title']] ?? null;

        if (!$newUserId || $newUserId === $prevUserId) {
            return;
        }

        $assignee = User::find($newUserId);

        if ($assignee?->email) {
            EnvoyerMailActionAssignee::dispatch($action, $reunion, $assignee)->onQueue('emails');
        }
    }

    /**
     * Archiver le snapshot JSON du CR sur S3.
     */
    private function archiveSnapshot(Reunion $reunion, string $orgSlug, string $summary, array $decisions, array $tasks, int $orgId): void
    {
        Storage::disk('s3')->put(
            "tenants/{$orgSlug}/reunions/{$reunion->reun_id}/compte-rendus/cr.json",
            json_encode([
                'summary'   => $summary,
                'decisions' => $decisions,
                'tasks'     => $tasks,
                'meta'      => [
                    'generated_at' => now()->toIso8601String(),
                    'org_id'       => $orgId,
                    'org_slug'     => $orgSlug,
                    'meeting_id'   => $reunion->reun_id,
                ],
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            'private'
        );
    }

    /**
     * Supprimer un fichier S3 avec log.
     */
    private function deleteFromS3(string $key): void
    {
        if (Storage::disk('s3')->exists($key)) {
            Storage::disk('s3')->delete($key);
            Log::info('S3 supprimé', ['key' => $key]);
        } else {
            Log::warning('S3 introuvable', ['key' => $key]);
        }
    }

    /**
     * Récupérer et vérifier la réunion (isolation tenant).
     */
    private function getReunion(int $reunId, int $orgId): Reunion
    {
        return Reunion::where('reun_id', $reunId)
            ->where('org_id', $orgId)
            ->firstOrFail();
    }

    /**
     * Récupérer le slug de l'organisation.
     */
    private function getOrgSlug(int $orgId): string
    {
        return Organisation::where('org_id', $orgId)->value('org_slug') ?? "org-{$orgId}";
    }

    /**
     * Récupérer l'org_id actif de l'utilisateur connecté.
     */
    private function getOrgId(Request $request): int
    {
        return (int) $request->user()
            ->appartenances()
            ->where('app_statut', 'actif')
            ->value('org_id');
    }

    /**
     * Formater un CR pour la réponse API.
     */
   private function format(CompteRendu $cr): array
    {
        return [
            'cr_id'           => $cr->cr_id,
            'meeting_id'      => $cr->reun_id,
            'summary'         => $cr->cr_resume,
            'decisions'       => $cr->decisions->map(fn ($d) => [
                'id'    => $d->dec_id,
                'text'  => $d->dec_intitule,
                'ordre' => $d->dec_ordre,
            ])->values(),
            'actions'         => $cr->actions->map(fn ($a) => [
                'id'       => $a->action_id,
                'title'    => $a->action_texte,
                'assignee' => $a->user ? trim("{$a->user->util_prenom} {$a->user->util_nom}") : null,
                'user_id'  => $a->user_id,   // ← ajout
                'due'      => $a->action_echeance?->toDateString(),
            ])->values(),
            'generated_by_ai' => $cr->estGenereParIa(),
            'has_file'        => $cr->estUploade(),
            'created_at'      => $cr->cr_date_creation?->toDateString(),
        ];
    }
}