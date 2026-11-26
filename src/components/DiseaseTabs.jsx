import { DISEASES } from "../data";
export default function DiseaseTabs({disease,onChange}) {
  return <nav className="disease-tabs" aria-label="Selecionar doença">
    {Object.entries(DISEASES).map(([key,item])=><button key={key} type="button"
      className={disease===key?"active":""} aria-current={disease===key?"page":undefined}
      onClick={()=>onChange(key)}>{item.name}</button>)}
  </nav>;
}