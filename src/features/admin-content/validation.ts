const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const definitionKeyPattern = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export class AdminFormError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AdminFormError"
  }
}

export function requiredString(
  formData: FormData,
  name: string,
  label: string,
  maxLength?: number,
) {
  const value = String(formData.get(name) ?? "").trim()

  if (!value) {
    throw new AdminFormError(`请填写${label}`)
  }

  if (maxLength && value.length > maxLength) {
    throw new AdminFormError(`${label}不能超过 ${maxLength} 个字符`)
  }

  return value
}

export function optionalString(
  formData: FormData,
  name: string,
  label: string,
  maxLength?: number,
) {
  const value = String(formData.get(name) ?? "").trim()

  if (!value) {
    return null
  }

  if (maxLength && value.length > maxLength) {
    throw new AdminFormError(`${label}不能超过 ${maxLength} 个字符`)
  }

  return value
}

export function slugString(formData: FormData, name: string, label: string) {
  const value = requiredString(formData, name, label, 180).toLowerCase()

  if (!slugPattern.test(value)) {
    throw new AdminFormError(`${label}只能使用小写字母、数字和短横线`)
  }

  return value
}

export function definitionKeyString(formData: FormData) {
  const value = requiredString(formData, "definitionKey", "频道定义 key", 180)
    .toLowerCase()
    .trim()

  if (!definitionKeyPattern.test(value)) {
    throw new AdminFormError(
      "频道定义 key 只能使用小写字母、数字、点号和短横线",
    )
  }

  return value
}

export function optionalInteger(
  formData: FormData,
  name: string,
  label: string,
  fallback: number,
  min = 0,
) {
  const rawValue = String(formData.get(name) ?? "").trim()

  if (!rawValue) {
    return fallback
  }

  const value = Number(rawValue)

  if (!Number.isInteger(value) || value < min) {
    throw new AdminFormError(`${label}必须是不小于 ${min} 的整数`)
  }

  return value
}

export function booleanField(formData: FormData, name: string) {
  return formData.get(name) === "on"
}

export function uuidString(formData: FormData, name: string, label: string) {
  const value = requiredString(formData, name, label)

  if (!uuidPattern.test(value)) {
    throw new AdminFormError(`${label}格式不正确`)
  }

  return value
}

export function optionalUuidString(
  formData: FormData,
  name: string,
  label: string,
) {
  const value = optionalString(formData, name, label)

  if (!value) {
    return null
  }

  if (!uuidPattern.test(value)) {
    throw new AdminFormError(`${label}格式不正确`)
  }

  return value
}

export function uuidList(formData: FormData, name: string, label: string) {
  const values = formData
    .getAll(name)
    .map((value) => String(value).trim())
    .filter(Boolean)

  for (const value of values) {
    if (!uuidPattern.test(value)) {
      throw new AdminFormError(`${label}中存在格式不正确的选项`)
    }
  }

  return Array.from(new Set(values))
}

export function selectValue<T extends string>(
  formData: FormData,
  name: string,
  label: string,
  allowedValues: readonly T[],
) {
  const value = requiredString(formData, name, label)

  if (!allowedValues.includes(value as T)) {
    throw new AdminFormError(`${label}不在允许范围内`)
  }

  return value as T
}
