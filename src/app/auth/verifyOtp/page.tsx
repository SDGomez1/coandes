import Image from "next/image";
import Logo from "@/assets/img/Logo.png";
import BGImage from "@/assets/img/login.webp";
import Gmail from "@/assets/img/gmail.png";
import Outlook from "@/assets/img/outlook.png";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import Link from "next/link";

export default function Page() {
  return (
    <section className="flex w-full overflow-y-hidden h-svh">
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
          <Separator className="shrink bg-primary" />
          <span className="bg-primary size-16 rounded-full flex justify-center items-center text-white text-2xl font-medium shrink-0">
            2
          </span>
        </div>
        <Image src={Logo} alt="logo" className="h-auto w-56 my-14" />
        <p className="font-medium text-gray-ligth mb-4">Bienvenido,</p>
        <h2 className="font-semibold text-black-ligth text-4xl mb-5">
          Revisa tu email
        </h2>
        <p className="font-medium text-gray-ligth mb-10 max-w-3/4">
          Te hemos enviado un correo electrónico a{" "}
          <span className="font-bold">admin@coandes.com</span> con el código de
          acceso.{" "}
        </p>
        <Label className="text-sm text-gray-ligth font-medium mb-2">
          Ingresa el código recibido
        </Label>
        <div className="mb-12">
          <InputOTP maxLength={6}>
            <InputOTPGroup className="gap-6">
              <InputOTPSlot
                index={0}
                className="!rounded-lg border-[#858997] h-16 w-auto aspect-[31/36] text-4xl text-gray border"
              />
              <InputOTPSlot
                index={1}
                className="!rounded-lg border-[#858997] h-16 w-auto aspect-[31/36] text-4xl text-gray border "
              />
              <InputOTPSlot
                index={2}
                className="!rounded-lg border-[#858997] h-16 w-auto aspect-[31/36] text-4xl text-gray border"
              />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup className="gap-6">
              <InputOTPSlot
                index={3}
                className="!rounded-lg border-[#858997] h-16 w-auto aspect-[31/36] text-4xl text-gray border"
              />
              <InputOTPSlot
                index={4}
                className="!rounded-lg border-[#858997] h-16 w-auto aspect-[31/36] text-4xl text-gray border"
              />
              <InputOTPSlot
                index={5}
                className="!rounded-lg border-[#858997] h-16 w-auto aspect-[31/36] text-4xl text-gray border"
              />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Link
          href={"/auth/verifyOtp"}
          className="h-16 mb-9 w-full text-white rounded bg-primary font-medium flex justify-center items-center"
        >
          Acceder
        </Link>
        <p className="text-primary  underline w-full text-center my-5">
          Reenviar código (00:30)
        </p>
        <Separator className="bg-primary/40" />
        <Link
          href={"/"}
          className="h-16 mt-9 w-full border  rounded-lg text-primary flex justify-center items-center gap-2 border-primary"
        >
          Cambiar correo electrónico
        </Link>
      </div>
    </section>
  );
}
