import { store } from "../store";

export async function render(host: HTMLElement) {
  const p = store.profile;
  host.innerHTML = `
    <h2>Настройки</h2>
    <div class="detail">
      <div class="meta">
        <p><strong>Аккаунт:</strong> ${p?.name ?? p?.email ?? "—"}</p>
        <p class="sub">Flac/HighRes: ${p?.is_flac_quality ? "да" : "нет"} · Аноним: ${p?.is_anonymous ? "да" : "нет"}</p>
      </div>
    </div>
    <p class="empty">Настройки качества и уведомлений появятся позже.</p>`;
}
