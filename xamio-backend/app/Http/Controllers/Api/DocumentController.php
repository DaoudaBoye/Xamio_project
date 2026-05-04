<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Organisation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Filesystem\FilesystemAdapter;

class DocumentController extends Controller
{
    private const S3_URL_TTL_MINUTES = 15;

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/documents
    // ─────────────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $orgId = $this->getOrgId($request);

        $documents = Document::where('org_id', $orgId)
            ->with('user')
            ->latest()
            ->get()
            ->map(fn($d) => $this->format($d));

        return response()->json(['data' => $documents]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/documents
    // Upload multipart → S3 + insertion BDD.
    // ─────────────────────────────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $orgId = $this->getOrgId($request);

        $request->validate([
            'fichier'     => 'required|file|mimes:pdf,docx,xlsx,png|max:51200',
            'nom'         => 'nullable|string|max:255',
            'categorie'   => 'nullable|string|max:100',
            'visibilite'  => 'required|in:prive,equipe,organisation',
        ]);

        $file    = $request->file('fichier');
        $orgSlug = $this->getOrgSlug($orgId);
        $uuid    = Str::uuid();
        $ext     = $file->getClientOriginalExtension();

        // Chemin S3 : tenants/{slug}/documents/{uuid}.{ext}
        $chemin = "tenants/{$orgSlug}/documents/{$uuid}.{$ext}";
        Storage::disk('s3')->put($chemin, file_get_contents($file), 'private');

        $document = Document::create([
            'org_id'            => $orgId,
            'user_id'           => $request->user()->id,
            'doc_nom'           => $request->nom ?? $file->getClientOriginalName(),
            'doc_type_mime'     => $file->getMimeType(),
            'doc_taille_octets' => $file->getSize(),
            'doc_chemin'        => $chemin,
            'doc_categorie'     => $request->categorie,
            'doc_partage'       => $request->visibilite !== 'prive',
            'doc_visibilite'    => $request->visibilite,
        ]);

        return response()->json([
            'message' => 'Document uploadé.',
            'data'    => $this->format($document->load('user')),
        ], 201);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/documents/{id}/download
    // Génère une URL signée S3 valable S3_URL_TTL_MINUTES minutes.
    // ─────────────────────────────────────────────────────────────────────────

    public function download(Request $request, int $id): JsonResponse
    {
        $orgId    = $this->getOrgId($request);
        $orgSlug  = $this->getOrgSlug($orgId);
        $document = $this->getDocument($id, $orgId);

        // Isolation tenant : le chemin doit commencer par le préfixe de l'org
        abort_if(
            !str_starts_with($document->doc_chemin, "tenants/{$orgSlug}/"),
            403,
            'Accès non autorisé.'
        );

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('s3');
        $url  = $disk->temporaryUrl(
            $document->doc_chemin,
            now()->addMinutes(self::S3_URL_TTL_MINUTES)
        );

        return response()->json(['url' => $url]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PATCH /api/documents/{id}
    // Met à jour les métadonnées (visibilité, nom, catégorie).
    // ─────────────────────────────────────────────────────────────────────────

    public function update(Request $request, int $id): JsonResponse
    {
        $orgId    = $this->getOrgId($request);
        $document = $this->getDocument($id, $orgId);

        $request->validate([
            'visibilite' => 'sometimes|in:prive,equipe,organisation',
            'nom'        => 'sometimes|string|max:255',
            'categorie'  => 'sometimes|nullable|string|max:100',
        ]);

        $patch = [];

        if ($request->has('visibilite')) {
            $patch['doc_visibilite'] = $request->visibilite;
            $patch['doc_partage']    = $request->visibilite !== 'prive';
        }
        if ($request->has('nom'))       $patch['doc_nom']       = $request->nom;
        if ($request->has('categorie')) $patch['doc_categorie']  = $request->categorie;

        $document->update($patch);

        return response()->json(['data' => $this->format($document->fresh('user'))]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /api/documents/{id}
    // Supprime le fichier S3 puis l'entrée BDD.
    // ─────────────────────────────────────────────────────────────────────────

    public function destroy(Request $request, int $id): JsonResponse
    {
        $orgId    = $this->getOrgId($request);
        $orgSlug  = $this->getOrgSlug($orgId);
        $document = $this->getDocument($id, $orgId);

        abort_if(
            !str_starts_with($document->doc_chemin, "tenants/{$orgSlug}/"),
            403,
            'Accès non autorisé au fichier.'
        );

        if (Storage::disk('s3')->exists($document->doc_chemin)) {
            Storage::disk('s3')->delete($document->doc_chemin);
        }

        $document->delete();

        return response()->json(['message' => 'Document supprimé.']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers privés
    // ─────────────────────────────────────────────────────────────────────────

    private function getDocument(int $id, int $orgId): Document
    {
        return Document::where('doc_id', $id)
            ->where('org_id', $orgId)
            ->firstOrFail();
    }

    private function getOrgId(Request $request): int
    {
        return (int) $request->user()
            ->appartenances()
            ->where('app_statut', 'actif')
            ->value('org_id');
    }

    private function getOrgSlug(int $orgId): string
    {
        return Organisation::where('org_id', $orgId)->value('org_slug') ?? "org-{$orgId}";
    }

    /**
     * Sérialise un Document en shape attendue par le frontend React.
     *
     * Mapping colonnes → clés JSON :
     *   doc_id            → id
     *   doc_nom           → name
     *   doc_type_mime     → type  (extension courte via extension())
     *   doc_taille_octets → size  (lisible via tailleHumaine())
     *   doc_partage       → shared
     *   doc_visibilite    → visibility
     *   doc_categorie     → category
     *   doc_indexe        → rag.indexed
     *   doc_nb_chunks     → rag.chunks
     *   doc_indexe_at     → rag.indexed_at
     */
    private function format(Document $d): array
    {
        return [
            'id'         => $d->doc_id,
            'name'       => $d->doc_nom,
            'type'       => $d->extension(),          // pdf | docx | xlsx | png
            'size'       => $d->tailleHumaine(),
            'shared'     => $d->doc_partage,
            'visibility' => $d->doc_visibilite,       // prive | equipe | organisation
            'category'   => $d->doc_categorie,
            'author'     => $d->user
                ? trim("{$d->user->util_prenom} {$d->user->util_nom}")
                : 'Inconnu',
            'source'     => 'library',
            'has_file'   => true,
            'created_at' => $d->created_at?->toDateString(),
            // Infos RAG exposées pour un futur panneau d'administration
            'rag' => [
                'indexed'    => $d->doc_indexe,
                'chunks'     => $d->doc_nb_chunks,
                'indexed_at' => $d->doc_indexe_at?->toIso8601String(),
            ],
        ];
    }
}