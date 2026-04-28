<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ScheduleMeetingReminders;
use App\Jobs\SendMeetingInvitation;
use App\Models\ContactExterne;
use App\Models\ParticipantReunion;
use App\Models\PointOrdreJour;
use App\Models\Reunion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ReunionController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────────
    // Constantes
    // ─────────────────────────────────────────────────────────────────────────

    private const ADMIN_ROLE_IDS  = [1, 2, 3, 4, 6];
    private const ADMIN_ROLE_NOMS = [
        'Super Admin', 'super_admin', 'superadmin',
        'Admin Entreprise', 'admin', 'Administrateur',
        'Directeur', 'directeur', 'DG', 'dg',
        'Manager', 'manager',          
        'Assistant', 'assistant', 'assistante', 
    ];

    private const RELATIONS_REUNION = [
        'pointOrdreJours',
        'participantReunions.contactExterne:contact_id,contact_nom,contact_email',
        'participantReunions.user:id,util_prenom,util_nom,email',
        'departements:dept_id,dept_nom',
        'organisateur:id,util_prenom,util_nom,email',
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/reunions
    // ─────────────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $orgId = $this->getOrgId($user);

        if (!$orgId) {
            return $this->errorResponse('Aucune organisation active.', 403);
        }

        $query = Reunion::where('org_id', $orgId)
            ->when($request->filled('date'), fn ($q) => $q->whereDate('reun_date', $request->date));

        // Filtre accès : admins/directeurs → tout
        // Autres → leurs réunions uniquement (créateur OU participant interne OU participant externe)
        if (!$this->isAdmin($user)) {
            $query->where(fn ($q) => $q
                ->where('user_id', $user->id) // ✅ créateur — toujours visible même sans invitation
                ->orWhereHas('participantReunions', fn ($pq) => $pq->where('user_id', $user->id))
                ->orWhereHas('participantReunions.contactExterne', fn ($cq) => $cq->where('contact_email', $user->email))
            );
        }

        $reunions = $query
            ->with(self::RELATIONS_REUNION)
            ->orderByDesc('reun_date')
            ->orderByDesc('reun_heure')
            ->get();

        return $this->successResponse($reunions);
    }

    // ─────────────────────────────────────────────────────────────
// GET /api/reunions/{reunion}
// ─────────────────────────────────────────────────────────────
    public function show(Request $request, Reunion $reunion): JsonResponse
    {
        $this->authorizeOrg($request, $reunion);

        if (!$this->isAdmin($request->user())) {
            $user = $request->user();
            $estInvite =
                $reunion->user_id === $user->id ||
                $reunion->participantReunions()->where('user_id', $user->id)->exists() ||
                $reunion->participantReunions()->whereHas('contactExterne', fn ($q) =>
                    $q->where('contact_email', $user->email)
                )->exists();

            abort_if(!$estInvite, 403, 'Accès non autorisé à cette réunion.');
        }

        return $this->successResponse(
            $reunion->load(self::RELATIONS_REUNION)
        );
    }
    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/reunions
    // ─────────────────────────────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reun_titre'             => 'required|string|max:255',
            'reun_date'              => 'required|date',
            'reun_heure'             => 'nullable|string',
            'reun_duree_min'         => 'nullable|integer|min:5|max:480',
            'reun_lieu'              => 'nullable|string|max:255',
            'reun_visibilite'        => 'nullable|in:organisation,direction',
            'dept_ids'               => 'nullable|array',
            'dept_ids.*'             => 'exists:departements,dept_id',
            'agenda'                 => 'nullable|array',
            'agenda.*.poj_intitule'  => 'required_with:agenda|string|max:255',
            'participants'           => 'nullable|array',
            'participants.*.email'   => 'required_with:participants|email',
            'participants.*.nom'     => 'nullable|string|max:100',
            'participants.*.societe' => 'nullable|string|max:100',
        ]);

        $user  = $request->user();
        $orgId = $this->getOrgId($user);

        if (!$orgId) {
            return $this->errorResponse('Aucune organisation active.', 403);
        }

        try {
            $reunion = DB::transaction(function () use ($validated, $user, $orgId) {

                $reunion = Reunion::create([
                    'reun_titre'      => $validated['reun_titre'],
                    'reun_date'       => $validated['reun_date'],
                    'reun_heure'      => $validated['reun_heure'] ?? null,
                    'reun_duree_min'  => $validated['reun_duree_min'] ?? 60,
                    'reun_lieu'       => $validated['reun_lieu'] ?? null,
                    'reun_statut'     => 'planifiee',
                    'reun_visibilite' => $validated['reun_visibilite'] ?? 'organisation',
                    'user_id'         => $user->id,
                    'org_id'          => $orgId,
                ]);

                // Départements
                if (!empty($validated['dept_ids'])) {
                    $reunion->departements()->sync($validated['dept_ids']);
                }

                // Points d'ordre du jour
                foreach ($validated['agenda'] ?? [] as $index => $point) {
                    PointOrdreJour::create([
                        'poj_intitule' => $point['poj_intitule'],
                        'poj_ordre'    => $index + 1,
                        'reun_id'      => $reunion->reun_id,
                    ]);
                }

                // Participants externes + invitations
                foreach ($validated['participants'] ?? [] as $participant) {
                    $this->inviterParticipant($reunion, $participant, $orgId);
                }

                return $reunion;
            });

            ScheduleMeetingReminders::dispatch($reunion);

            return $this->successResponse(
                $reunion->load(self::RELATIONS_REUNION),
                'Réunion créée avec succès.',
                201
            );

        } catch (\Throwable $e) {
            Log::error('Erreur création réunion', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse('Erreur serveur : ' . $e->getMessage(), 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PATCH /api/reunions/{reunion}/statut
    // ─────────────────────────────────────────────────────────────────────────

    public function updateStatut(Request $request, Reunion $reunion): JsonResponse
    {
        $this->authorizeOrg($request, $reunion);

        $validated = $request->validate([
            'reun_statut' => 'required|in:planifiee,en_cours,terminee,annulee,reportee',
        ]);

        if ($reunion->reun_statut === 'annulee') {
            return $this->errorResponse('Impossible de modifier le statut d\'une réunion annulée.', 422);
        }

        $reunion->update(['reun_statut' => $validated['reun_statut']]);

        return $this->successResponse(['statut' => $reunion->reun_statut]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PATCH /api/reunions/{reunion}/reporter
    // ─────────────────────────────────────────────────────────────────────────

    public function reporter(Request $request, Reunion $reunion): JsonResponse
    {
        $this->authorizeOrg($request, $reunion);

        $validated = $request->validate([
            'reun_date'         => 'required|date|after:today',
            'reun_heure'        => 'nullable|string|max:10',
            'reun_report_motif' => 'nullable|string|max:500',
        ]);

        if (in_array($reunion->reun_statut, ['annulee', 'terminee'])) {
            return $this->errorResponse(
                'Impossible de reporter une réunion ' . $reunion->reun_statut . '.',
                422
            );
        }

        try {
            $reunion->update([
                'reun_statut'       => 'reportee',
                'reun_date'         => $validated['reun_date'],
                'reun_heure'        => $validated['reun_heure'] ?? $reunion->reun_heure,
                'reun_report_motif' => $validated['reun_report_motif'] ?? null,
            ]);

            return $this->successResponse(
                $reunion->load(self::RELATIONS_REUNION),
                'Réunion reportée avec succès.'
            );

        } catch (\Throwable $e) {
            Log::error('Erreur report réunion', ['reun_id' => $reunion->reun_id, 'error' => $e->getMessage()]);
            return $this->errorResponse('Erreur serveur : ' . $e->getMessage(), 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PATCH /api/reunions/{reunion}/annuler
    // ─────────────────────────────────────────────────────────────────────────

    public function annuler(Request $request, Reunion $reunion): JsonResponse
    {
        $this->authorizeOrg($request, $reunion);

        $validated = $request->validate([
            'reun_annul_motif' => 'nullable|string|max:500',
        ]);

        if ($reunion->reun_statut === 'annulee') {
            return $this->errorResponse('Cette réunion est déjà annulée.', 422);
        }

        if ($reunion->reun_statut === 'terminee' && !$this->isAdmin($request->user())) {
            return $this->errorResponse('Seul un administrateur peut annuler une réunion terminée.', 403);
        }

        try {
            $reunion->update([
                'reun_statut'      => 'annulee',
                'reun_annul_motif' => $validated['reun_annul_motif'] ?? null,
            ]);

            return $this->successResponse(
                $reunion->load(self::RELATIONS_REUNION),
                'Réunion annulée avec succès.'
            );

        } catch (\Throwable $e) {
            Log::error('Erreur annulation réunion', ['reun_id' => $reunion->reun_id, 'error' => $e->getMessage()]);
            return $this->errorResponse('Erreur serveur : ' . $e->getMessage(), 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers privés
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Créer un participant externe et dispatcher l'invitation.
     */
    private function inviterParticipant(Reunion $reunion, array $participant, int $orgId): void
    {
        $contact = ContactExterne::firstOrCreate(
            ['contact_email' => $participant['email'], 'org_id' => $orgId],
            [
                'contact_nom'     => $participant['nom']     ?? '',
                'contact_societe' => $participant['societe'] ?? '',
            ]
        );

        $token = Str::random(64);

        ParticipantReunion::create([
            'part_statut'            => 'invite',
            'part_statut_invitation' => 'en_attente',
            'part_token'             => $token,
            'contact_id'             => $contact->contact_id,
            'user_id'                => null,
            'reun_id'                => $reunion->reun_id,
        ]);

        SendMeetingInvitation::dispatch(
            $reunion,
            $contact->contact_email,
            $contact->contact_nom ?: $contact->contact_email,
            $token,
        );
    }

    /**
     * Vérifier que la réunion appartient bien à l'org de l'utilisateur.
     */
    private function authorizeOrg(Request $request, Reunion $reunion): void
    {
        $orgId = $this->getOrgId($request->user());

        abort_if($reunion->org_id !== $orgId, 403, 'Accès non autorisé.');
    }

    /**
     * L'utilisateur a-t-il un rôle Admin / Directeur ?
     */
    private function isAdmin($user): bool
    {
        $appartenance = $user->appartenances()
            ->where('app_statut', 'actif')
            ->with('role')
            ->first();

        return in_array((int) ($appartenance?->role_id ?? 0), self::ADMIN_ROLE_IDS)
            || in_array((string) ($appartenance?->role?->role_nom ?? ''), self::ADMIN_ROLE_NOMS);
    }

    /**
     * Récupérer l'org_id actif de l'utilisateur.
     */
    private function getOrgId($user): ?int
    {
        if (!empty($user->org_id)) {
            return (int) $user->org_id;
        }

        $orgId = $user->appartenances()
            ->where('app_statut', 'actif')
            ->value('org_id');

        return $orgId ? (int) $orgId : null;
    }

    /**
     * Réponse JSON de succès standardisée.
     */
    private function successResponse(mixed $data, string $message = 'OK', int $status = 200): JsonResponse
    {
        $payload = ['success' => true];

        if ($message !== 'OK') {
            $payload['message'] = $message;
        }

        // data peut être une collection, un modèle, ou un tableau
        if ($data instanceof \Illuminate\Database\Eloquent\Model) {
            $payload['reunion'] = $data;
        } elseif ($data instanceof \Illuminate\Support\Collection) {
            $payload['data'] = $data;
        } else {
            $payload = array_merge($payload, (array) $data);
        }

        return response()->json($payload, $status);
    }

    /**
     * Réponse JSON d'erreur standardisée.
     */
    private function errorResponse(string $message, int $status): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], $status);
    }
    
}