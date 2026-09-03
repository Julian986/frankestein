import Link from "next/link";
import { FoodForm } from "@/components/FoodForm";

export default function NuevoAlimentoPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo alimento</h1>
          <p className="mt-1 text-sm text-muted">
           {/*  Cargá los macros vos (por unidad) */}
          </p>
        </div>
        <Link href="/alimentos" className="text-sm font-semibold text-muted">
          Cerrar
        </Link>
      </header>
      <FoodForm />
    </div>
  );
}
