import { useState } from "react";

import { ChevronDown } from "lucide-react";



/** Painel recolhível no telemóvel; no desktop fica sempre expandido. */

export default function CollapsiblePanel({

  title,

  hint,

  children,

  defaultOpen = false,

  testId,

}) {

  const [open, setOpen] = useState(defaultOpen);



  return (

    <section className="mktvid-panel-compact" data-testid={testId}>

      <button

        type="button"

        className="md:hidden w-full flex items-center justify-between gap-2 text-left"

        onClick={() => setOpen((v) => !v)}

        aria-expanded={open}

      >

        <span className="min-w-0">

          <span className="mktvid-panel-title block">{title}</span>

          {hint ? (

            <span className="text-[10px] text-[#6b6b70] mt-0.5 block line-clamp-1">{hint}</span>

          ) : null}

        </span>

        <ChevronDown className={`w-4 h-4 shrink-0 text-[#8A8A8E] transition-transform ${open ? "rotate-180" : ""}`} />

      </button>



      <div className="hidden md:block">

        <h3 className="mktvid-panel-title">{title}</h3>

        {hint ? <p className="text-[11px] text-[#6b6b70] mt-1 mb-2">{hint}</p> : null}

      </div>



      <div className={`${open ? "block" : "hidden"} md:block mt-2 md:mt-0`}>

        {children}

      </div>

    </section>

  );

}


