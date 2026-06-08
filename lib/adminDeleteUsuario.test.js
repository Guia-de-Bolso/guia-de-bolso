import assert from "node:assert/strict";
import test from "node:test";
import {
  AdminDeleteUsuarioError,
  adminDeleteUsuario,
  isUsuarioDeleteConfirmationValid,
  validateAdminCanDeleteUsuario,
} from "./adminDeleteUsuario.js";

test("validateAdminCanDeleteUsuario bloqueia autoexclusão e equipe admin", () => {
  const self = validateAdminCanDeleteUsuario({
    adminId: "a",
    targetPerfil: { id: "a", role: "usuario" },
  });
  assert.equal(self.ok, false);
  assert.equal(self.code, "SELF_DELETE");

  const dev = validateAdminCanDeleteUsuario({
    adminId: "a",
    targetPerfil: { id: "b", role: "dev" },
  });
  assert.equal(dev.ok, false);
  assert.equal(dev.code, "PROTECTED_ROLE");

  const ok = validateAdminCanDeleteUsuario({
    adminId: "a",
    targetPerfil: { id: "b", role: "usuario" },
  });
  assert.equal(ok.ok, true);
});

test("isUsuarioDeleteConfirmationValid exige e-mail ou nome conforme perfil", () => {
  assert.equal(
    isUsuarioDeleteConfirmationValid(
      { email: "Teste@Email.com", nome: "João" },
      { confirmEmail: "teste@email.com" }
    ),
    true
  );
  assert.equal(
    isUsuarioDeleteConfirmationValid(
      { email: "teste@email.com", nome: "João" },
      { confirmEmail: "outro@email.com" }
    ),
    false
  );
  assert.equal(
    isUsuarioDeleteConfirmationValid(
      { email: null, nome: "Maria Silva" },
      { confirmNome: "maria silva" }
    ),
    true
  );
});

test("adminDeleteUsuario registra auditoria e remove conta", async () => {
  const adminUser = {
    id: "admin-1",
    email: "admin@test.com",
    user_metadata: { full_name: "Admin" },
  };
  const targetId = "user-1";
  const events = { log: null, deleted: false };

  const serviceClient = {
    from(table) {
      if (table === "perfis") {
        return {
          select() {
            return {
              eq(_col, id) {
                return {
                  maybeSingle() {
                    return Promise.resolve({
                      data: {
                        id: targetId,
                        nome: "Visitante",
                        email: "visitante@test.com",
                        role: "usuario",
                      },
                      error: null,
                    });
                  },
                };
              },
            };
          },
          delete() {
            return {
              eq() {
                return Promise.resolve({ error: null });
              },
            };
          },
        };
      }

      return {
        delete() {
          return {
            eq() {
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
    storage: {
      from() {
        return {
          list() {
            return Promise.resolve({ data: [], error: null });
          },
          remove() {
            return Promise.resolve({ error: null });
          },
        };
      },
    },
    auth: {
      admin: {
        deleteUser(id) {
          events.deleted = id;
          return Promise.resolve({ error: null });
        },
      },
    },
  };

  const auditSupabase = {
    from(table) {
      if (table !== "logs") {
        throw new Error(`unexpected table ${table}`);
      }
      return {
        insert(payload) {
          events.log = payload;
          return Promise.resolve({ error: null });
        },
      };
    },
  };

  const result = await adminDeleteUsuario(serviceClient, {
    auditSupabase,
    adminUser,
    targetUserId: targetId,
    confirmation: { confirmEmail: "visitante@test.com" },
  });

  assert.equal(result.ok, true);
  assert.equal(events.deleted, targetId);
  assert.equal(events.log.acao, "admin_excluiu_usuario");
  assert.equal(events.log.detalhes.alvo_id, targetId);
});

test("adminDeleteUsuario falha com confirmação inválida", async () => {
  const serviceClient = {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle() {
                  return Promise.resolve({
                    data: {
                      id: "user-1",
                      nome: "Visitante",
                      email: "visitante@test.com",
                      role: "usuario",
                    },
                    error: null,
                  });
                },
              };
            },
          };
        },
      };
    },
  };

  await assert.rejects(
    () =>
      adminDeleteUsuario(serviceClient, {
        auditSupabase: { from: () => ({ insert: () => Promise.resolve({}) }) },
        adminUser: { id: "admin-1", email: "admin@test.com" },
        targetUserId: "user-1",
        confirmation: { confirmEmail: "errado@test.com" },
      }),
    AdminDeleteUsuarioError
  );
});
