import { isHave } from './check_value';

export function toUpperCase(text) {
  text = text.toString()
    .toUpperCase();

  return text;
}

export function ensureToString(value) {
  if (isHave(value) === false) {
    value = "";
  }
  return value + "";
}
