import { formatDateLabelEs } from "@/lib/nutrition";

type Props = {
  isoDate: string;
};

export function DateLabel({ isoDate }: Props) {
  return (
    <p className="text-sm font-medium capitalize text-muted">
      {formatDateLabelEs(isoDate)}
    </p>
  );
}
