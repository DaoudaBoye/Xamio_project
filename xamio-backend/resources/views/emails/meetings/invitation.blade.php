@component('mail::message')

Bonjour **{{ $nomDestinataire }}**,

Vous êtes invité(e) à la réunion suivante :

## {{ $reunion->reun_titre }}

@component('mail::panel')
📅 **Date :** {{ \Carbon\Carbon::parse($reunion->reun_date)->format('d/m/Y') }}
⏰ **Heure :** {{ $reunion->reun_heure ? \Carbon\Carbon::parse($reunion->reun_heure)->format('H\hi') : 'Non définie' }}
⏱ **Durée :** {{ $reunion->reun_duree_min }} minutes
📍 **Lieu :** {{ $reunion->reun_lieu ?? 'Non défini' }}
@endcomponent

@if(isset($pointsOrdreJour) && count($pointsOrdreJour) > 0)
### Ordre du jour

@foreach($pointsOrdreJour as $point)
{{ $loop->iteration }}. {{ $point->poj_intitule }}
@endforeach

@endif

---

### Serez-vous présent(e) ?

Merci de nous indiquer votre disponibilité en cliquant sur l'un des boutons ci-dessous :

@component('mail::button', ['url' => config('app.url') . '/api/invitations/' . $token . '/accept', 'color' => 'success'])
✅ Je serai présent(e)
@endcomponent

@component('mail::button', ['url' => config('app.url') . '/api/invitations/' . $token . '/decline', 'color' => 'error'])
❌ Je ne pourrai pas venir
@endcomponent

@component('mail::button', ['url' => config('app.url') . '/api/invitations/' . $token . '/maybe', 'color' => 'primary'])
⏳ Je ne sais pas encore
@endcomponent

---

Cordialement,
**L'équipe XAMIO**

@endcomponent