import { ExternalLink } from '@/components/external-link'
import Image from 'next/image'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-2xl sm:p-8 p-4 text-sm sm:text-base items-center">
        <Image
            src="/images/un-hero.png"
            alt="UN Hero"
            className="rounded-lg -my-8 sm:-my-4 "
            width={250} // specify width
            height={50} // specify height
          />
        <h1 className="text-2xl sm:text-3xl tracking-tight font-semibold max-w-fit inline-block text-center">
        Find the initiatives that impact you
        </h1>
        <p className="leading-normal text-zinc-500 text-center">
        This is an experimental prototype designed to use AI to provide answers about case studies and best practices for improving quality of life.
        Please confirm any information with the original sources to ensure accuracy.
        </p>
      </div>
    </div>
  )
}
