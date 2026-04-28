{{-- resources/views/emails/meetings/action-assignee.blade.php --}}
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Action assignée</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #F0F2F5; margin: 0; padding: 32px 16px; color: #1A1F36; }
    .card { background: #fff; border-radius: 12px; max-width: 560px; margin: 0 auto; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
    .header { background: #1E6FE8; padding: 28px 32px; }
    .header h1 { color: #fff; font-size: 20px; margin: 0; font-weight: 700; letter-spacing: -.3px; }
    .header p  { color: rgba(255,255,255,.7); font-size: 13px; margin: 6px 0 0; }
    .body { padding: 28px 32px; }
    .greeting { font-size: 15px; margin: 0 0 18px; }
    .action-box { background: #EFF6FF; border: 1.5px solid #BFDBFE; border-radius: 10px; padding: 16px 20px; margin: 0 0 22px; }
    .action-box p { margin: 0; font-size: 15px; font-weight: 600; color: #1E6FE8; line-height: 1.55; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    .meta-table td { padding: 9px 0; font-size: 13px; border-bottom: 1px solid #F3F4F6; }
    .meta-table td:first-child { color: #6B7280; width: 130px; }
    .meta-table td:last-child { font-weight: 600; color: #1A1F36; }
    .meta-table tr:last-child td { border-bottom: none; }
    .btn-wrap { text-align: center; margin: 0 0 24px; }
    .btn { display: inline-block; background: #1E6FE8; color: #fff !important; text-decoration: none; font-size: 14px; font-weight: 600; padding: 13px 32px; border-radius: 8px; letter-spacing: .2px; }
    .btn:hover { background: #1558c0; }
    .footer { padding: 18px 32px; background: #F9FAFB; border-top: 1px solid #E5E7EB; font-size: 11.5px; color: #9CA3AF; text-align: center; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">

    <div class="header">
      <h1>⚡ Action assignée</h1>
      <p>Xamio · Notification automatique</p>
    </div>

    <div class="body">
      <p class="greeting">
        Bonjour <strong>{{ $prenom }} {{ $nom }}</strong>,
      </p>
      <p style="font-size:14px;color:#374151;margin:0 0 18px;line-height:1.65;">
        Une action vous a été assignée suite à la réunion
        <strong>« {{ $reunion }} »</strong>{{ $date ? ' du ' . $date : '' }}.
      </p>

      <div class="action-box">
        <p>{{ $action }}</p>
      </div>

      <table class="meta-table">
        @if($echeance)
        <tr>
          <td>📅 Échéance</td>
          <td style="color:#F05A28;">{{ $echeance }}</td>
        </tr>
        @endif
        <tr>
          <td>📋 Réunion</td>
          <td>{{ $reunion }}</td>
        </tr>
        <tr>
          <td>🔘 Statut initial</td>
          <td style="color:#059669;">À faire</td>
        </tr>
      </table>

      <div class="btn-wrap">
        <a href="{{ config('app.frontend_url', config('app.url')) }}/login" class="btn">
          Se connecter pour voir mon action
        </a>
      </div>

      <p style="font-size:12px;color:#9CA3AF;margin:0;line-height:1.6;text-align:center;">
        Ou copiez ce lien dans votre navigateur :<br>
        <span style="color:#1E6FE8;">{{ config('app.frontend_url', config('app.url')) }}/login</span>
      </p>
    </div>

    <div class="footer">
      © {{ date('Y') }} Xamio &nbsp;·&nbsp; Ce message est automatique, merci de ne pas y répondre.
    </div>

  </div>
</body>
</html>