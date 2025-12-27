import { Button } from "@/components/ui/button";
import { DialogClose, DialogTitle } from "@/components/ui/dialog";

export function CancelConfirmation({
  onBack,
  onConfirm,
  isEditing,
}: {
  onBack: () => void;
  onConfirm: () => void;
  isEditing?: boolean;
}) {
  return (
    <div className="px-9 flex flex-col h-[400px] pb-11 overflow-y-auto">
      <div>
        <DialogTitle className="text-lg font-semibold mb-2">
          ¿Cancelar la {!isEditing ? "creación" : "edición"} de los parámetro?
        </DialogTitle>
        <p className="text-gray-600 mb-4">
          Tiene cambios sin guardar en la{" "}
          {!isEditing ? "creación de un nuevo " : "edición de un "} parámetro
          del catálogo.
        </p>
        <p className="text-gray-600">
          Si sale ahora, los cambios no serán guardados.
        </p>
      </div>

      <div className="flex gap-4 mt-auto">
        <Button
          variant="outline"
          className="w-1/2 border-primary text-primary shrink"
          onClick={onBack}
        >
          Volver a edición
        </Button>
        <DialogClose asChild>
          <Button
            className="w-1/2 bg-primary text-white shrink"
            onClick={onConfirm}
          >
            Confirmar cancelación
          </Button>
        </DialogClose>
      </div>
    </div>
  );
}
