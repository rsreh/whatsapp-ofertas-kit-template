"use client";

import { useActionState } from "react";
import { dealAction, type ActionState } from "./actions";

const initialState: ActionState = { status: "idle" };

export function DealForm() {
  const [state, formAction, pending] = useActionState(
    dealAction,
    initialState,
  );

  return (
    <form action={formAction} className="card">
      <label>
        URL do produto
        <input
          name="url"
          type="url"
          required
          autoComplete="off"
          placeholder="https://..."
        />
      </label>

      <div className="grid">
        <label>
          Título (opcional)
          <input name="title" placeholder="Preenchido pela URL" />
        </label>
        <label>
          Loja (opcional)
          <input name="shopName" placeholder="Loja Exemplo" />
        </label>
        <label>
          Preço (opcional)
          <input name="price" inputMode="decimal" placeholder="99,90" />
        </label>
        <label>
          Preço original (opcional)
          <input
            name="originalPrice"
            inputMode="decimal"
            placeholder="129,90"
          />
        </label>
      </div>

      <label>
        Imagem (opcional)
        <input name="imageUrl" type="url" placeholder="https://.../foto.jpg" />
      </label>

      <label>
        Cupom / observação (opcional)
        <input name="note" placeholder="Cupom FRETE10" />
      </label>

      <div className="actions">
        <button
          type="submit"
          name="intent"
          value="preview"
          disabled={pending}
          className="ghost"
        >
          {pending ? "Aguarde…" : "Pré-visualizar"}
        </button>
        <button
          type="submit"
          name="intent"
          value="send"
          disabled={pending}
          className="primary"
        >
          {pending ? "Enviando…" : "Enviar para o WhatsApp"}
        </button>
      </div>

      {state.status === "preview" && state.message && (
        <div className="result">
          <p className="label">Prévia da mensagem</p>
          <pre>{state.message}</pre>
          {state.link && (
            <p className="hint">
              Link:{" "}
              <a href={state.link} target="_blank" rel="noreferrer">
                {state.link}
              </a>
            </p>
          )}
        </div>
      )}

      {state.status === "sent" && (
        <p className="alert ok">Mensagem enviada.</p>
      )}

      {state.status === "error" && (
        <p className="alert error">{state.error}</p>
      )}
    </form>
  );
}
