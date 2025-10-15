import Image from "next/image";
import Logo from "@/assets/img/Logo.png";
import BGImage from "@/assets/img/login.webp";
import Gmail from "@/assets/img/gmail.png";
import Outlook from "@/assets/img/outlook.png";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <section className="flex w-full">
      <div className="w-1/2 relative">
        <div className="w-full h-full bg-black opacity-60 absolute"></div>
        <Image src={BGImage} alt="logo" className="w-full " />
      </div>
      <div className="w-1/2 flex flex-col py-11 px-20">
        <div className="flex items-center justify-center ">
          <span className="bg-primary size-16 rounded-full flex justify-center items-center text-white text-2xl font-medium shrink-0">
            1
          </span>
          <Separator className="bg-primary shrink" />
          <Separator className="shrink" />
          <span className="bg-white border border-primary size-16 rounded-full flex justify-center items-center text-primary text-2xl font-medium shrink-0">
            2
          </span>
        </div>
        <Image src={Logo} alt="logo" className="h-auto w-56 my-14" />
        <p className="font-medium text-gray-ligth mb-4">Bienvenido,</p>
        <h2 className="font-semibold text-black-ligth text-4xl mb-5">
          Inicia sesión
        </h2>
        <p className="font-medium text-gray-ligth mb-16">
          Ingreso a la plataforma de administración
        </p>
        <Label className="text-sm text-gray-ligth font-normal mb-2">
          Usuario o correo electrónico
        </Label>
        <Input
          placeholder="Usuario o correo electrónico"
          className="h-16 mb-11"
        />
        <Link
          href={"/auth/verifyOtp"}
          className="h-16 mb-9 w-full text-white rounded bg-primary font-medium flex justify-center items-center"
        >
          Continuar
        </Link>
        <p className="text-gray-ligth w-full text-center mb-5">Ingresar con</p>
        <div className="flex justify-center gap-5">
          <Button
            variant={"outline"}
            className="h-16 mb-9 w-60 text-black-ligth flex justify-center items-center gap-2"
          >
            <Image src={Outlook} alt="logo" className="size-6" />
            Outlook
          </Button>
          <Button
            variant={"outline"}
            className="h-16 mb-9 w-60 text-black-ligth flex justify-center items-center gap-2"
          >
            <Image src={Gmail} alt="logo" className="size-6 " />
            Gmail
          </Button>
        </div>
      </div>
    </section>
  );
}
