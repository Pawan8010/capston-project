import React from "react";
import { BadgeCheck, ScanLine, ShoppingCart, Store } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import { useLanguage } from "../context/LanguageContext";
import { Alert, Button, Card, CardBody, EmptyState } from "../components/ui";

const PLANNED = [
  {
    icon: BadgeCheck,
    title: "Breed-verified listings",
    body: "A listing carries the model's identification and confidence, so the stated breed is backed by a scan rather than a seller's word.",
  },
  {
    icon: ScanLine,
    title: "Scan-to-list",
    body: "List an animal straight from a scan in your history, with its breed and care profile already attached.",
  },
  {
    icon: Store,
    title: "Local discovery",
    body: "Find animals by breed and region, using the same breed table the rest of the app runs on.",
  },
];

/**
 * Marketplace is not built yet.
 *
 * The previous version shipped invented listings — prices, seller towns and
 * yields for animals that do not exist. Fabricated records that look real
 * are worse than an empty page, so this states the position plainly and
 * points at the features that do work.
 */
export default function Marketplace() {
  const { t } = useLanguage();

  return (
    <AppShell title={t("marketplace")}>
      <PageHeader
        eyebrow="Not yet available"
        title={t("marketplace") || "Marketplace"}
        subtitle="Buying and selling is not implemented yet. Here is what it will do when it is."
      />

      <div className="stack stack--6">
        <Alert tone="info" title="There is no marketplace backend yet">
          Nothing is listed, priced or for sale. This page will stay empty until real listings
          exist — it will not show sample animals that could be mistaken for genuine ones.
        </Alert>

        <Card>
          <CardBody>
            <EmptyState
              icon={ShoppingCart}
              title="No listings"
              action={
                <Button to="/upload" variant="primary" icon={ScanLine}>
                  Identify an animal instead
                </Button>
              }
            >
              When the marketplace opens, animals you have scanned can be listed from your herd.
            </EmptyState>
          </CardBody>
        </Card>

        <div>
          <h2 className="section__title" style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-4)" }}>
            Planned
          </h2>
          <div className="grid grid--3">
            {PLANNED.map(({ icon: Icon, title, body }) => (
              <Card key={title}>
                <CardBody>
                  <span className="feature-card__icon">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <h3 className="feature-card__title">{title}</h3>
                  <p className="feature-card__body">{body}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
