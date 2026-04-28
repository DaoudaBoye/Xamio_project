<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactExterne;
use App\Models\RendezVous;
use App\Models\RdvParticipant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RdvController extends Controller
{
    private const ADMIN_ROLE_IDS  = [1, 2, 6];
    private const ADMIN_ROLE_NOMS = [
        'Super Admin', 'super_admin', 'superadmin',
        'Admin Entreprise', 'admin', 'Administrateur',
        'Directeur', 'directeur', 'DG', 'dg',
    ];

    private const MANAGER_ROLE_IDS  = [3, 4];
    private const MANAGER_ROLE_NOMS = [
        'Manager', 'manager',
        'Assistant', 'Assistante', 'assistant', 'assistante',
    ];

    private const RELATIONS_RDV = [
        'participants.user:id,util_nom,util_prenom,email',
        'participants.contactExterne:contact_id,contact_nom,contact_email',
        'contactExterne:contact_id,contact_nom,contact_email,contact_tel,contact_societe',
    ];

    private const RAPPELS_VALIDES = [15, 30, 60, 120, 1440, 2880];

    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $orgId = $this->getOrgId($user);

        if (!$orgId) {
            return $this->errorResponse('Aucune organisation active.', 403);
        }

        $query = RendezVous::where('org_id', $orgId)
            ->when($request->filled('date'),   fn ($q) => $q->whereDate('rdv_date', $request->date))
            ->when($request->filled('statut'), fn ($q) => $q->where('rdv_statut', $request->statut));

        $this->applyVisibilityFilter($query, $user);

        $rdvs = $query
            ->with(self::RELATIONS_RDV)
            ->orderByDesc('rdv_date')
            ->orderByDesc('rdv_heure')
            ->get();

        return $this->successResponse($rdvs);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rdv_titre'                       => 'required|string|max:255',
            'rdv_date'                        => 'required|date|after_or_equal:today',
            'rdv_heure'                       => 'nullable|string|max:10',
            'rdv_duree'                       => 'nullable|integer|min:5|max:480',
            'rdv_type'                        => 'nullable|string|max:100',
            'rdv_lieu'                        => 'nullable|string|max:255',
            'rdv_description'                 => 'nullable|string|max:1000',
            'rdv_visibilite'                  => 'required|in:tous,direction',
            'rdv_rappels'                     => 'nullable|array',
            'rdv_rappels.*'                   => 'integer|in:' . implode(',', self::RAPPELS_VALIDES),
            'contact_principal'               => 'nullable|array',
            'contact_principal.nom'           => 'nullable|string|max:100',
            'contact_principal.email'         => 'nullable|email|max:255',
            'contact_principal.tel'           => 'nullable|string|max:30',
            'contact_principal.societe'       => 'nullable|string|max:100',
            'contact_principal.type'          => 'nullable|in:personne,entreprise',
            'participants_internes'           => 'nullable|array',
            'participants_internes.*.user_id' => 'required|exists:users,id',
            'participants_externes'           => 'nullable|array',
            'participants_externes.*.email'   => 'required|email',
            'participants_externes.*.nom'     => 'nullable|string|max:100',
            'participants_externes.*.societe' => 'nullable|string|max:100',
        ]);

        $user  = $request->user();
        $orgId = $this->getOrgId($user);

        if (!$orgId) {
            return $this->errorResponse('Aucune organisation active.', 403);
        }

        try {
            $rdv = DB::transaction(function () use ($validated, $user, $orgId) {

                $contactPrincipalId = $this->resolveContactPrincipal($validated['contact_principal'] ?? null, $orgId);

                $rdv = RendezVous::create([
                    'rdv_titre'       => $validated['rdv_titre'],
                    'rdv_date'        => $validated['rdv_date'],
                    'rdv_heure'       => $validated['rdv_heure']       ?? null,
                    'rdv_duree'       => $validated['rdv_duree']       ?? 60,
                    'rdv_type'        => $validated['rdv_type']        ?? null,
                    'rdv_lieu'        => $validated['rdv_lieu']        ?? null,
                    'rdv_description' => $validated['rdv_description'] ?? null,
                    'rdv_statut'      => RendezVous::STATUT_PLANIFIE,
                    'rdv_visibilite'  => $validated['rdv_visibilite'],
                    'rdv_rappels'     => $validated['rdv_rappels']     ?? [],
                    'contact_id'      => $contactPrincipalId,
                    'org_id'          => $orgId,
                    'user_id'         => $user->id,
                ]);

                foreach ($validated['participants_internes'] ?? [] as $p) {
                    $this->createParticipant($rdv, userId: $p['user_id']);
                }

                foreach ($validated['participants_externes'] ?? [] as $p) {
                    $contact = $this->findOrCreateContact($p, $orgId);
                    $this->createParticipant($rdv, contactId: $contact->contact_id);
                }

                return $rdv;
            });

            return $this->successResponse($rdv->load(self::RELATIONS_RDV), 'Rendez-vous créé avec succès.', 201);

        } catch (\Throwable $e) {
            Log::error('Erreur création rendez-vous', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return $this->errorResponse('Erreur serveur : ' . $e->getMessage(), 500);
        }
    }

    public function show(RendezVous $rdv): JsonResponse
    {
        return $this->successResponse($rdv->load(self::RELATIONS_RDV));
    }

    public function update(Request $request, RendezVous $rdv): JsonResponse
    {
        if ($rdv->estAnnule()) {
            return $this->errorResponse('Impossible de modifier un rendez-vous annulé.', 422);
        }

        if ($rdv->estTermine()) {
            return $this->errorResponse('Impossible de modifier un rendez-vous terminé.', 422);
        }

        $validated = $request->validate([
            'rdv_titre'       => 'sometimes|string|max:255',
            'rdv_date'        => 'sometimes|date|after_or_equal:today',
            'rdv_heure'       => 'sometimes|string|max:10',
            'rdv_duree'       => 'nullable|integer|min:5|max:480',
            'rdv_type'        => 'nullable|string|max:100',
            'rdv_lieu'        => 'nullable|string|max:255',
            'rdv_description' => 'nullable|string|max:1000',
            'rdv_visibilite'  => 'sometimes|in:tous,direction',
            'rdv_rappels'     => 'nullable|array',
            'rdv_rappels.*'   => 'integer|in:' . implode(',', self::RAPPELS_VALIDES),
            'contact_id'      => 'nullable|exists:contact_externes,contact_id',
        ]);

        try {
            $rdv->update($validated);
            return $this->successResponse($rdv->load(self::RELATIONS_RDV), 'Rendez-vous mis à jour.');

        } catch (\Throwable $e) {
            Log::error('Erreur mise à jour rendez-vous', ['rdv_id' => $rdv->rdv_id, 'error' => $e->getMessage()]);
            return $this->errorResponse('Erreur serveur : ' . $e->getMessage(), 500);
        }
    }

    public function updateStatut(Request $request, RendezVous $rdv): JsonResponse
    {
        $validated = $request->validate([
            'rdv_statut' => 'required|in:' . implode(',', [
                RendezVous::STATUT_PLANIFIE,
                RendezVous::STATUT_CONFIRME,
                RendezVous::STATUT_ANNULE,
                RendezVous::STATUT_TERMINE,
            ]),
        ]);

        if ($rdv->estAnnule()) {
            return $this->errorResponse('Impossible de modifier le statut d\'un rendez-vous annulé.', 422);
        }

        $rdv->update(['rdv_statut' => $validated['rdv_statut']]);

        return $this->successResponse(['statut' => $rdv->rdv_statut]);
    }

    public function annuler(Request $request, RendezVous $rdv): JsonResponse
    {
        if ($rdv->estAnnule()) {
            return $this->errorResponse('Ce rendez-vous est déjà annulé.', 422);
        }

        if ($rdv->estTermine() && !$this->isAdmin($request->user())) {
            return $this->errorResponse('Seul un administrateur peut annuler un rendez-vous terminé.', 403);
        }

        try {
            $rdv->update(['rdv_statut' => RendezVous::STATUT_ANNULE]);
            return $this->successResponse($rdv->load(self::RELATIONS_RDV), 'Rendez-vous annulé avec succès.');

        } catch (\Throwable $e) {
            Log::error('Erreur annulation rendez-vous', ['rdv_id' => $rdv->rdv_id, 'error' => $e->getMessage()]);
            return $this->errorResponse('Erreur serveur : ' . $e->getMessage(), 500);
        }
    }

    public function destroy(RendezVous $rdv): JsonResponse
    {
        try {
            $rdv->participants()->delete();
            $rdv->delete();

            return $this->successResponse(null, 'Rendez-vous supprimé.');

        } catch (\Throwable $e) {
            Log::error('Erreur suppression rendez-vous', ['rdv_id' => $rdv->rdv_id, 'error' => $e->getMessage()]);
            return $this->errorResponse('Erreur serveur : ' . $e->getMessage(), 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers privés
    // ─────────────────────────────────────────────────────────────────────────

    private function applyVisibilityFilter(\Illuminate\Database\Eloquent\Builder $query, $user): void
    {
        $appartenance = $user->appartenances()
            ->where('app_statut', 'actif')
            ->with('role')
            ->first();

        $roleId = (int)    ($appartenance?->role_id        ?? 0);
        $role   = (string) ($appartenance?->role?->role_nom ?? '');

        if (in_array($roleId, self::ADMIN_ROLE_IDS) || in_array($role, self::ADMIN_ROLE_NOMS)) {
            return;
        }

        if (in_array($roleId, self::MANAGER_ROLE_IDS) || in_array($role, self::MANAGER_ROLE_NOMS)) {
            $query->where(fn ($q) => $q
                ->where('rdv_visibilite', 'tous')
                ->orWhere('user_id', $user->id)
            );
            return;
        }

        $query->where(fn ($q) => $q
            ->where('user_id', $user->id)
            ->orWhereHas('participants.contactExterne', fn ($cq) => $cq->where('contact_email', $user->email))
        );
    }

    /**
     * ✅ updateOrCreate — évite les violations de contrainte unique
     */
    private function resolveContactPrincipal(?array $data, int $orgId): ?int
    {
        if (empty($data['email'])) {
            return null;
        }

        return ContactExterne::updateOrCreate(
            ['contact_email' => $data['email'], 'org_id' => $orgId],
            [
                'contact_nom'     => $data['nom']     ?? '',
                'contact_tel'     => $data['tel']     ?? null,
                'contact_societe' => $data['societe'] ?? null,
            ]
        )->contact_id;
    }

    /**
     * ✅ updateOrCreate — évite les violations de contrainte unique
     */
    private function findOrCreateContact(array $data, int $orgId): ContactExterne
    {
        return ContactExterne::updateOrCreate(
            ['contact_email' => $data['email'], 'org_id' => $orgId],
            [
                'contact_nom'     => $data['nom']     ?? '',
                'contact_societe' => $data['societe'] ?? null,
            ]
        );
    }

    private function createParticipant(RendezVous $rdv, ?int $userId = null, ?int $contactId = null): void
    {
        RdvParticipant::create([
            'part_statut'            => RdvParticipant::STATUT_INVITE,
            'part_statut_invitation' => 'en_attente',
            'part_token'             => Str::random(64),
            'user_id'                => $userId,
            'contact_id'             => $contactId,
            'rdv_id'                 => $rdv->rdv_id,
        ]);
    }

    private function isAdmin($user): bool
    {
        $appartenance = $user->appartenances()
            ->where('app_statut', 'actif')
            ->with('role')
            ->first();

        return in_array((int) ($appartenance?->role_id ?? 0), self::ADMIN_ROLE_IDS)
            || in_array((string) ($appartenance?->role?->role_nom ?? ''), self::ADMIN_ROLE_NOMS);
    }

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

    private function successResponse(mixed $data, string $message = 'OK', int $status = 200): JsonResponse
    {
        $payload = ['success' => true];

        if ($message !== 'OK') {
            $payload['message'] = $message;
        }

        if ($data !== null) {
            $payload['data'] = $data;
        }

        return response()->json($payload, $status);
    }

    private function errorResponse(string $message, int $status): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message], $status);
    }
}