import { useEffect, useRef, useState, type FormEvent } from 'react';
import { invitationPath, inviteRequest, InviteApiError, jsonPost, type Invitation, type SocialPending, type TutorSession } from './inviteApi';
import './invite.css';

// O token é uma credencial de uso único. Retirá-lo da URL antes de carregar o Google evita exposição por Referer.
const invitationToken = new URLSearchParams(window.location.search).get('token')?.trim() || '';
if (window.location.search) window.history.replaceState(window.history.state, '', window.location.pathname);

type GoogleApi = { accounts: { id: {
  initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void;
  renderButton: (element: HTMLElement, options: { theme: string; size: string; text: string; locale: string }) => void;
} } };
type GoogleWindow = Window & { google?: GoogleApi };
let googleHandler: ((credential: string) => void) | null = null;
let googleInitialized = false;
let googleLoading: Promise<GoogleApi> | null = null;

function loadGoogle(): Promise<GoogleApi> {
  const existing = (window as GoogleWindow).google;
  if (existing) return Promise.resolve(existing);
  if (!googleLoading) googleLoading = new Promise<GoogleApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      const api = (window as GoogleWindow).google;
      api ? resolve(api) : reject(new Error('Não foi possível iniciar o login com Google.'));
    };
    script.onerror = () => reject(new Error('Não foi possível carregar o login com Google.'));
    document.head.appendChild(script);
  }).catch(error => { googleLoading = null; throw error; });
  return googleLoading!;
}

function errorText(error: unknown): string {
  if (error instanceof InviteApiError) {
    if (error.status === 410 || error.status === 404) return 'Este convite expirou ou não está mais disponível. Peça um novo convite.';
    if (error.status === 401) return 'E-mail ou senha inválidos.';
    return error.message;
  }
  return error instanceof Error ? error.message : 'Não foi possível concluir a solicitação. Tente novamente.';
}

const permissionLabels: Record<string, string> = {
  LEITURA: 'acompanhar',
  EDICAO: 'acompanhar e editar',
  VISUALIZAR_PRONTUARIO: 'acompanhar e consultar o prontuário',
};

export default function InvitePage() {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(Boolean(invitationToken));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [linkGoogleToken, setLinkGoogleToken] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const googleButton = useRef<HTMLDivElement>(null);
  const googleCallback = useRef<(credential: string) => void>(() => {});

  useEffect(() => {
    document.title = 'Aceitar convite | VetSync';
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.appendChild(robots); }
    robots.content = 'noindex, nofollow, noarchive';
    if (!invitationToken) { setError('Link de convite incompleto. Peça um novo convite.'); return; }
    let active = true;
    inviteRequest<Invitation>(invitationPath(invitationToken))
      .then(value => { if (active) setInvitation(value); })
      .catch(reason => { if (active) setError(errorText(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function accept(session: TutorSession) {
    if (session.perfil !== 'TUTOR' || session.email.trim().toLowerCase() !== invitation?.email.trim().toLowerCase()) {
      throw new Error('Entre com a conta de tutor correspondente ao e-mail do convite.');
    }
    await jsonPost<unknown>(`/convites/${encodeURIComponent(invitationToken)}/aceitar-logado`, {}, session.token);
    setDone(true);
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    setBusy(true);
    try {
      // O cadastro já aceita o convite na mesma transação. O JWT retornado não é guardado no site.
      await jsonPost<unknown>('/auth/registrar-convite', {
        token: invitationToken, nome: name.trim(), cpf: cpf.replace(/\D/g, ''),
        telefone: phone.replace(/\D/g, ''), senha: password,
      });
      setPassword(''); setConfirmPassword(''); setDone(true);
    } catch (reason) { setError(errorText(reason)); } finally { setBusy(false); }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const session = await jsonPost<TutorSession>('/auth/login', { email: invitation?.email, senha: password });
      await accept(session);
      setPassword('');
    } catch (reason) { setError(errorText(reason)); } finally { setBusy(false); }
  }

  async function loginGoogle(idToken: string) {
    setError(''); setBusy(true);
    try {
      const session = await jsonPost<TutorSession>('/auth/social-login', { provider: 'GOOGLE', idToken });
      await accept(session);
    } catch (reason) {
      if (reason instanceof InviteApiError && reason.status === 409 &&
          (reason.body as SocialPending | null)?.status === 'VINCULO_NECESSARIO') {
        setLinkGoogleToken(idToken);
        setError('Esta conta Google ainda não está vinculada. Informe a senha da sua conta VetSync para confirmar o vínculo.');
      } else setError(errorText(reason));
    } finally { setBusy(false); }
  }
  googleCallback.current = credential => { void loginGoogle(credential); };

  useEffect(() => {
    if (!invitation?.contaExistente || !googleButton.current) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    let active = true;
    googleHandler = credential => googleCallback.current(credential);
    loadGoogle().then(google => {
      if (!active || !googleButton.current) return;
      if (!googleInitialized) {
        google.accounts.id.initialize({ client_id: clientId, callback: response => googleHandler?.(response.credential) });
        googleInitialized = true;
      }
      googleButton.current.replaceChildren();
      google.accounts.id.renderButton(googleButton.current, { theme: 'outline', size: 'large', text: 'signin_with', locale: 'pt-BR' });
    }).catch(reason => { if (active) setError(errorText(reason)); });
    return () => { active = false; googleHandler = null; };
  }, [invitation]);

  async function linkGoogle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const session = await jsonPost<TutorSession>('/auth/social-vincular', {
        provider: 'GOOGLE', idToken: linkGoogleToken, email: invitation?.email, senha: linkPassword,
      });
      await accept(session);
      setLinkGoogleToken(''); setLinkPassword('');
    } catch (reason) { setError(errorText(reason)); } finally { setBusy(false); }
  }

  return <main className="invite-page"><section className="invite-card">
    <div className="invite-brand"><span className="invite-mark">V</span><span>VetSync</span></div>
    {done ? <><h1>Convite aceito!</h1><p>Você já pode entrar no aplicativo VetSync e acompanhar os pets compartilhados com sua conta.</p></> : <>
      <p className="invite-kicker">Acesso compartilhado</p><h1>Aceitar convite</h1>
      {loading && <p role="status">Carregando convite…</p>}
      {invitation && <><p>Você recebeu um convite para acompanhar {invitation.nomePet.toLowerCase() === 'todos os pets' ? 'todos os pets' : invitation.nomePet}.</p>
        <div className="invite-summary"><span>E-mail convidado</span><strong>{invitation.email}</strong></div>
        <p className="invite-detail">Permissão: {permissionLabels[invitation.permissao] || 'acompanhar'}.
          {invitation.expiraEm ? ` Válido até ${new Date(invitation.expiraEm).toLocaleString('pt-BR')}.` : ''}</p>
        {invitation.contaExistente ? <>
          <p>Entre com sua conta VetSync para aceitar o convite.</p>
          <form onSubmit={login}>
            <label>Senha<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
            <button disabled={busy}>Entrar e aceitar</button>
          </form>
          {import.meta.env.VITE_GOOGLE_CLIENT_ID ? <><p className="invite-divider">ou entre com Google</p><div ref={googleButton} className="invite-google" /></> : null}
          {linkGoogleToken && <form onSubmit={linkGoogle}>
            <label>Senha VetSync para vincular o Google<input type="password" autoComplete="current-password" value={linkPassword} onChange={e => setLinkPassword(e.target.value)} required /></label>
            <button disabled={busy}>Vincular e aceitar</button>
          </form>}
        </> : <><p>Crie sua conta para aceitar o convite.</p><form onSubmit={register}>
          <label>Nome completo<input value={name} onChange={e => setName(e.target.value)} autoComplete="name" minLength={2} maxLength={100} required /></label>
          <label>CPF<input value={cpf} onChange={e => setCpf(e.target.value)} inputMode="numeric" autoComplete="off" pattern="[0-9.\- ]{11,14}" required /></label>
          <label>Telefone<input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" required /></label>
          <label>Senha<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" minLength={6} required /></label>
          <label>Confirme a senha<input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" minLength={6} required /></label>
          <button disabled={busy}>Criar conta e aceitar</button>
        </form></>}
      </>}
      {error && <p className="invite-error" role="alert">{error}</p>}
    </>}
  </section></main>;
}
