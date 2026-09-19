import type { Bundle, FhirResource, Reference } from 'fhir/r4'

/**
 * Índice de los recursos de un Bundle para resolver referencias internas.
 * Acepta las formas que aparecen en la guía RDA y sus ejemplos:
 * `fullUrl` completo, `urn:uuid:...`, `Tipo/id`, URL absoluta que termina en
 * `Tipo/id`, y el `id` a secas (los ejemplos oficiales usan `"Condition-0"`).
 */
export class BundleIndex {
  private readonly byKey = new Map<string, FhirResource>()
  private readonly byType = new Map<string, FhirResource[]>()

  constructor(bundle: Bundle) {
    for (const entry of bundle.entry ?? []) {
      const resource = entry.resource
      if (!resource) continue
      if (entry.fullUrl) this.byKey.set(entry.fullUrl, resource)
      if (resource.id) {
        this.byKey.set(`${resource.resourceType}/${resource.id}`, resource)
        // Un id a secas solo se registra si no colisiona con otro recurso.
        if (!this.byKey.has(resource.id)) this.byKey.set(resource.id, resource)
      }
      const list = this.byType.get(resource.resourceType) ?? []
      list.push(resource)
      this.byType.set(resource.resourceType, list)
    }
  }

  resolve<T extends FhirResource = FhirResource>(ref: Reference | string | undefined): T | undefined {
    const raw = typeof ref === 'string' ? ref : ref?.reference
    if (!raw) return undefined
    const direct = this.byKey.get(raw)
    if (direct) return direct as T
    // URL absoluta o relativa con historial: quedarse con `Tipo/id`.
    const match = raw.match(/([A-Za-z]+\/[A-Za-z0-9\-.]{1,64})(?:\/_history\/[^/]+)?$/)
    if (match) {
      const byTypeId = this.byKey.get(match[1])
      if (byTypeId) return byTypeId as T
      const bareId = match[1].split('/')[1]
      const byId = this.byKey.get(bareId)
      if (byId) return byId as T
    }
    return undefined
  }

  all<T extends FhirResource>(resourceType: T['resourceType']): T[] {
    return (this.byType.get(resourceType) ?? []) as T[]
  }

  first<T extends FhirResource>(resourceType: T['resourceType']): T | undefined {
    return this.all<T>(resourceType)[0]
  }
}
