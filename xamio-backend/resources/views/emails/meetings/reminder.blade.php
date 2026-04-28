@component('mail::message')

Bonjour **{{ $nomDestinataire }}**,

Ceci est un rappel — votre réunion commence **{{ $label }}** :

---

## {{ $reunion->reun_titre }}

@component('mail::panel')
📅 **Date :** {{ \Carbon\Carbon::parse($reunion->reun_date)->format('d/m/Y') }}
⏰ **Heure :** {{ $reunion->reun_heure ? \Carbon\Carbon::parse($reunion->reun_heure)->format('H\hi') : 'Non définie' }}
⏱ **Durée :** {{ $reunion->reun_duree_min }} minutes
📍 **Lieu :** {{ $reunion->reun_lieu ?? 'Non défini' }}
@endcomponent

@component('mail::button', ['url' => config('app.url') . '/meetings'])
Voir la réunion
@endcomponent

Cordialement,
**L'équipe XAMIO**

@endcomponent
