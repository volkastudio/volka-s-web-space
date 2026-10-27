import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Mail,
  Users,
  ShoppingBag,
  Plus,
  Play,
  Pause,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  Save,
  Check,
  Loader2,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  getAdminSequences,
  toggleSequence,
  updateStep,
  sendTestSequence,
} from "@/lib/sales/sales.functions";

export const Route = createFileRoute("/admin/sales/sequences")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Séquences de Suivi Acheteurs — Volka Studio Admin" },
    ],
  }),
  loader: async () => {
    return await getAdminSequences();
  },
  component: AdminSalesSequencesPage,
});

interface SequenceStep {
  id: string;
  position: number;
  delay_days: number;
  subject_fr: string;
  body_fr: string;
  stop_on_reply: boolean;
}

interface SequenceItem {
  id: string;
  key: string;
  name: string;
  scope: Record<string, unknown>;
  active: boolean;
  email_sequence_steps?: SequenceStep[];
}

const DEFAULT_STEPS: SequenceStep[] = [
  {
    id: "step-1",
    position: 1,
    delay_days: 3,
    subject_fr: "Comment se passe la prise en main de {{produit}} ?",
    body_fr: `Bonjour {{prénom}},

Je prends quelques minutes pour m'assurer que vous avez bien pu accéder à vos contenus et commencer la mise en pratique de {{produit}}.

Avez-vous rencontré la moindre difficulté sur un des points ou un blocage technique ?

Si une question se pose sur l'application concrète dans votre contexte, vous pouvez répondre directement à cet email. Je lis personnellement chaque message.

Bien à vous,
Durock — Volka Studio`,
    stop_on_reply: true,
  },
  {
    id: "step-2",
    position: 2,
    delay_days: 10,
    subject_fr: "Un point clé souvent négligé sur {{produit}}",
    body_fr: `Bonjour {{prénom}},

Après une dizaine de jours d'utilisation, voici un retour d'expérience fréquent :

La majorité des équipes essaie de tout implémenter d'un coup. Le meilleur résultat s'obtient pourtant en calant d'abord le premier parcours (la prise de contact directe) avant d'ajouter le reste.

Avez-vous eu l'occasion de tester cette première étape ?

Toujours disponible en réponse directe si besoin d'un regard rapide.

L'équipe Volka Studio`,
    stop_on_reply: true,
  },
  {
    id: "step-3",
    position: 3,
    delay_days: 21,
    subject_fr: "Identifier vos prochains leviers de croissance",
    body_fr: `Bonjour {{prénom}},

Trois semaines après votre acquisition de {{produit}}, vous avez désormais une vision plus claire de vos priorités opérationnelles.

Si vous souhaitez faire le point sur vos goulots d'étranglement (conversion, acquisition ou suivi de prospects), nous proposons chaque mois un nombre limité de diagnostics stratégiques gratuits :

-> https://volkastudio.com/audit?src=buyer-followup

Le diagnostic est confidentiel, sans engagement et vous livre une scorecard sur 5 piliers clés.

Excellente continuation dans vos déploiements,
Durock — Volka Studio`,
    stop_on_reply: true,
  },
];

function AdminSalesSequencesPage() {
  const loaderData = Route.useLoaderData() as {
    sequences: SequenceItem[];
    stats: { scheduled: number; sent: number; suppressed: number };
  };

  const [sequences, setSequences] = React.useState<SequenceItem[]>(
    loaderData.sequences?.length
      ? loaderData.sequences
      : [
          {
            id: "default-seq-id",
            key: "buyer-followup-default",
            name: "Suivi acheteur standard (J+3, J+10, J+21)",
            scope: { all_products: true },
            active: false,
            email_sequence_steps: DEFAULT_STEPS,
          },
        ]
  );

  const [steps, setSteps] = React.useState<SequenceStep[]>(
    sequences[0]?.email_sequence_steps?.length
      ? sequences[0].email_sequence_steps
      : DEFAULT_STEPS
  );

  const [editingStepId, setEditingStepId] = React.useState<string | null>(null);
  const [draftStep, setDraftStep] = React.useState<SequenceStep | null>(null);
  const [savingStep, setSavingStep] = React.useState(false);

  // Test modal
  const [testModalStep, setTestModalStep] = React.useState<SequenceStep | null>(null);
  const [testEmail, setTestEmail] = React.useState("contact@volkastudio.com");
  const [sendingTest, setSendingTest] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const activeSequence = sequences[0];

  const handleToggleActive = async () => {
    if (!activeSequence) return;
    const nextState = !activeSequence.active;
    try {
      if (activeSequence.id !== "default-seq-id") {
        await toggleSequence({
          data: {
            sequenceId: activeSequence.id,
            active: nextState,
          },
        });
      }
      setSequences((prev) =>
        prev.map((s, i) => (i === 0 ? { ...s, active: nextState } : s))
      );
      setToastMessage(
        nextState
          ? "Séquence activée : les acheteurs éligibles recevront les emails aux échéances."
          : "Séquence mise en pause globale."
      );
    } catch (err: any) {
      alert(err.message || "Erreur lors du changement de statut.");
    }
  };

  const handleStartEdit = (step: SequenceStep) => {
    setEditingStepId(step.id);
    setDraftStep({ ...step });
  };

  const handleSaveStep = async () => {
    if (!draftStep) return;
    setSavingStep(true);
    try {
      if (!draftStep.id.startsWith("step-")) {
        await updateStep({
          data: {
            stepId: draftStep.id,
            delay_days: draftStep.delay_days,
            subject_fr: draftStep.subject_fr,
            body_fr: draftStep.body_fr,
          },
        });
      }
      setSteps((prev) =>
        prev.map((s) => (s.id === draftStep.id ? { ...draftStep } : s))
      );
      setEditingStepId(null);
      setDraftStep(null);
      setToastMessage("Modèle d'email mis à jour avec succès.");
    } catch (err: any) {
      alert(err.message || "Erreur lors de la sauvegarde.");
    } finally {
      setSavingStep(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testModalStep) return;
    setSendingTest(true);
    try {
      if (!testModalStep.id.startsWith("step-")) {
        await sendTestSequence({
          data: {
            stepId: testModalStep.id,
            recipientEmail: testEmail,
          },
        });
      }
      setTestModalStep(null);
      setToastMessage(`Email de test envoyé à ${testEmail}`);
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'envoi du test.");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-md bg-forest-black border border-mint text-paper text-sm shadow-xl flex items-center gap-2">
          <CheckCircle2 className="size-4 text-mint" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light text-forest-black">
            Séquences & Suivi Acheteurs
          </h1>
          <p className="text-sm text-forest-black/70">
            Automatisations d'emails de courtoisie et d'orientation post-achat (Phase 14.2).
          </p>
        </div>

        {/* Quick Nav */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/admin/sales"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border border-pine/20 hover:bg-pine/10 text-forest-black/70 transition-colors"
          >
            <ShoppingBag className="size-3.5" /> Pages de vente
          </Link>
          <Link
            to="/admin/sales/buyers"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border border-pine/20 hover:bg-pine/10 text-forest-black/70 transition-colors"
          >
            <Users className="size-3.5" /> Acheteurs
          </Link>
        </div>
      </div>

      {/* Global Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-soft-paper/60 border border-pine/15 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-forest-black/50 block">
              Statut du moteur de suivi
            </span>
            <span className="text-lg font-bold text-forest-black flex items-center gap-2 mt-0.5">
              <span
                className={`size-2.5 rounded-full ${
                  activeSequence?.active ? "bg-mint animate-pulse" : "bg-forest-black/30"
                }`}
              />
              {activeSequence?.active ? "Actif & planifié" : "En pause (inactif)"}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleActive}
            className="text-xs h-8 border-pine/20 hover:bg-soft-paper"
          >
            {activeSequence?.active ? (
              <>
                <Pause className="mr-1.5 size-3.5 text-ochre" /> Suspendre
              </>
            ) : (
              <>
                <Play className="mr-1.5 size-3.5 text-pine" /> Activer
              </>
            )}
          </Button>
        </div>

        <div className="p-4 rounded-xl bg-soft-paper/60 border border-pine/15">
          <span className="text-[10px] uppercase font-mono tracking-wider text-forest-black/50 block">
            Emails délivrés / programmés
          </span>
          <span className="text-lg font-bold text-forest-black mt-0.5 block">
            {loaderData.stats?.sent ?? 0} envoyés · {loaderData.stats?.scheduled ?? 0} prévus
          </span>
        </div>

        <div className="p-4 rounded-xl bg-soft-paper/60 border border-pine/15">
          <span className="text-[10px] uppercase font-mono tracking-wider text-forest-black/50 block">
            Suppression list (D24)
          </span>
          <span className="text-lg font-bold text-forest-black mt-0.5 block">
            {loaderData.stats?.suppressed ?? 0} désabonnement(s)
          </span>
        </div>
      </div>

      {/* Compliance Warning / Strategy Rule Note */}
      <div className="p-4 rounded-xl bg-pine text-paper space-y-1.5 text-xs">
        <div className="flex items-center gap-2 font-semibold text-mint">
          <ShieldCheck className="size-4" />
          <span>Garantie de consentement strict (Règle D24 & Confidentialité)</span>
        </div>
        <p className="text-paper/85 leading-relaxed">
          Seuls les acheteurs enregistrés avec <strong>Consentement marketing = OUI</strong> reçoivent cette séquence. Tout acheteur avec consentement "inconnu" ou "non" est strictement ignoré. Chaque email comporte un lien de désabonnement direct à 1 clic.
        </p>
      </div>

      {/* Sequence Steps List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-forest-black font-semibold">
            Étapes de la séquence standard (J+3, J+10, J+21)
          </h2>
          <span className="text-xs font-mono text-forest-black/50">
            Variables disponibles : <code>{"{{prénom}}"}</code>, <code>{"{{produit}}"}</code>
          </span>
        </div>

        <div className="space-y-6">
          {steps.map((step, idx) => {
            const isEditing = editingStepId === step.id;
            return (
              <div
                key={step.id}
                className="bg-soft-paper/50 rounded-xl border border-pine/15 p-6 space-y-4 shadow-xs"
              >
                {/* Step header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pine/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="size-7 rounded-full bg-pine text-paper text-xs font-mono font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="font-display text-lg text-forest-black font-semibold">
                        Étape {idx + 1} — Déclenchement à J+{step.delay_days} jours
                      </h3>
                      <span className="text-xs text-forest-black/60">
                        {idx === 0 && "Check-in humain et disponibilité d'aide"}
                        {idx === 1 && "Conseil d'application ciblé (aucun push commercial)"}
                        {idx === 2 && "Invitation douce à l'Audit Croissance (/audit)"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTestModalStep(step)}
                      className="text-xs h-7 border-pine/20 hover:bg-soft-paper flex items-center gap-1.5"
                    >
                      <Send className="size-3 text-pine" /> Tester
                    </Button>

                    {!isEditing ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartEdit(step)}
                        className="text-xs h-7 border-pine/20 hover:bg-soft-paper flex items-center gap-1.5"
                      >
                        <Edit2 className="size-3 text-forest-black/70" /> Modifier
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleSaveStep}
                        disabled={savingStep}
                        className="text-xs h-7 bg-pine text-paper hover:bg-pine/90 flex items-center gap-1.5"
                      >
                        {savingStep ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Check className="size-3 text-mint" />
                        )}
                        Enregistrer
                      </Button>
                    )}
                  </div>
                </div>

                {/* Step Content */}
                {!isEditing ? (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-warm-ivory rounded-lg border border-pine/10">
                      <span className="font-medium text-forest-black/60 block text-[11px] mb-1">
                        Objet :
                      </span>
                      <p className="font-semibold text-forest-black text-sm">
                        {step.subject_fr}
                      </p>
                    </div>

                    <div className="p-4 bg-warm-ivory rounded-lg border border-pine/10 space-y-1">
                      <span className="font-medium text-forest-black/60 block text-[11px] mb-2">
                        Corps du message :
                      </span>
                      <pre className="font-sans text-forest-black/85 text-xs whitespace-pre-wrap leading-relaxed">
                        {step.body_fr}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="sm:col-span-1 space-y-1">
                        <Label className="text-[11px] text-forest-black/70">
                          Délai après l'achat (jours)
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          max={90}
                          value={draftStep?.delay_days ?? 3}
                          onChange={(e) =>
                            setDraftStep(
                              draftStep
                                ? { ...draftStep, delay_days: parseInt(e.target.value) || 1 }
                                : null
                            )
                          }
                          className="bg-warm-ivory border-pine/20 text-xs"
                        />
                      </div>

                      <div className="sm:col-span-3 space-y-1">
                        <Label className="text-[11px] text-forest-black/70">
                          Objet de l'email
                        </Label>
                        <Input
                          value={draftStep?.subject_fr ?? ""}
                          onChange={(e) =>
                            setDraftStep(
                              draftStep
                                ? { ...draftStep, subject_fr: e.target.value }
                                : null
                            )
                          }
                          className="bg-warm-ivory border-pine/20 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-forest-black/70">
                        Corps du message
                      </Label>
                      <Textarea
                        rows={8}
                        value={draftStep?.body_fr ?? ""}
                        onChange={(e) =>
                          setDraftStep(
                            draftStep ? { ...draftStep, body_fr: e.target.value } : null
                          )
                        }
                        className="bg-warm-ivory border-pine/20 text-xs leading-relaxed"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SEND TEST MODAL */}
      {testModalStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setTestModalStep(null)}
          />
          <div className="relative bg-warm-ivory border border-pine/20 rounded-xl max-w-md w-full p-6 shadow-2xl z-10 space-y-5">
            <div className="flex items-center justify-between border-b border-pine/10 pb-3">
              <div>
                <h3 className="font-display text-xl text-forest-black font-semibold">
                  Envoyer un email de test
                </h3>
                <p className="text-xs text-forest-black/70">
                  Vérifiez le rendu réel dans votre boîte de réception
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTestModalStep(null)}
                className="p-1 rounded-full hover:bg-soft-paper text-forest-black/60"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSendTest} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-forest-black font-medium">Adresse email destinataire</Label>
                <Input
                  type="email"
                  required
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="bg-soft-paper border-pine/20 text-xs"
                />
              </div>

              <div className="p-3 rounded-lg bg-soft-paper border border-pine/10 text-[11px] text-forest-black/70">
                Les variables <code>{"{{prénom}}"}</code> et <code>{"{{produit}}"}</code> seront automatiquement substituées par des valeurs d'exemple.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTestModalStep(null)}
                  disabled={sendingTest}
                  className="text-xs"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={sendingTest}
                  className="text-xs bg-pine text-paper hover:bg-pine/90 flex items-center gap-1.5"
                >
                  {sendingTest ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5 text-mint" />
                  )}
                  Envoyer le test
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
