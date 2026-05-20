import Select from "../ui/Select";
import { fieldTypes } from "../../utils/constants";

export default function FieldTypePicker(props) {
  return (
    <Select {...props}>
      {fieldTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
    </Select>
  );
}
