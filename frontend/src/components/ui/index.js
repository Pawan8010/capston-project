/**
 * Design-system barrel.
 *
 *   import { Button, Card, CardBody, Stat, Badge } from "../components/ui";
 *
 * Pages should import primitives from here rather than reaching for a
 * file path, so a primitive can move without touching every consumer.
 */

export { default as Button } from "./Button";
export { default as Card, CardHeader, CardBody, CardFooter } from "./Card";
export { default as Modal } from "./Modal";

export { Field, Input, Textarea, Select } from "./Field";

export {
  Badge,
  Alert,
  Spinner,
  Skeleton,
  SkeletonText,
  Progress,
  EmptyState,
} from "./Feedback";

export { Stat, Tabs, Segmented, Table, Avatar, Tooltip } from "./Data";
