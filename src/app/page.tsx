import Image from "next/image";
import Logo from "@/assets/img/Logo.png";
import BGImage from "@/assets/img/login.webp";
import Link from "next/link";

export default function Home() {
  return (
    <section className="flex w-full overflow-y-hidden">
      <div className="w-1/2 relative max-h-screen hidden lg:block">
        <div className="w-full h-full bg-black opacity-60 absolute"></div>
        <Image src={BGImage} alt="logo" className="w-full " />
      </div>
      <div className="lg:w-1/2 flex flex-col py-11 px-6 lg:px-20 justify-center overflow-y-auto">
        <Image src={Logo} alt="logo" className="h-auto w-56 my-14" />
        <h2 className="font-semibold text-black-ligth text-4xl mb-5">
          Plataforma de gestión{" "}
        </h2>
        <p className="font-medium text-gray-ligth mb-16">
          Inventarios, compras, bodega y despachos.
        </p>
        <Link
          href={"/auth/login"}
          className="w-full bg-primary text-center text-white py-3 rounded"
        >
          Continuar al inicio de sesión
        </Link>
      </div>
    </section>
  );
}
