export const onlyDigits = (value: string) => value.replace(/\D/g, "");
export function phoneMask(value: string) {
  const v = onlyDigits(value).slice(0, 11);
  return v.length > 10
    ? v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
    : v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
}
export function cpfMask(value: string) {
  return onlyDigits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
export function cepMask(value: string) {
  return onlyDigits(value)
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}
export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
