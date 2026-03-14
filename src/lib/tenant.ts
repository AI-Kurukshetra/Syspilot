const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"])

function stripPort(host: string): string {
  return host.split(":")[0]?.toLowerCase() ?? ""
}

export function getRootDomain(): string {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim().toLowerCase()
  return rootDomain && rootDomain.length > 0 ? rootDomain : "syspilot.vercel.app"
}

function getProjectNameFromRootDomain(rootDomain: string): string | null {
  const normalizedRootDomain = stripPort(rootDomain)
  const configuredName = process.env.NEXT_PUBLIC_VERCEL_PROJECT_NAME?.trim().toLowerCase()
  if (configuredName) {
    return configuredName
  }

  const parts = normalizedRootDomain.split(".")
  if (parts.length === 2 && parts[1] === "vercel" && parts[0]) {
    return parts[0]
  }

  if (parts.length === 3 && parts[1] === "vercel" && parts[2] === "app" && parts[0]) {
    return parts[0]
  }

  return null
}

export function extractTenantSlugFromHost(host: string): string | null {
  const sanitizedHost = stripPort(host)

  if (!sanitizedHost || LOCAL_HOSTS.has(sanitizedHost)) {
    return null
  }

  const rootDomain = getRootDomain()
  const normalizedRootDomain = stripPort(rootDomain)
  const projectName = getProjectNameFromRootDomain(normalizedRootDomain)

  if (sanitizedHost === normalizedRootDomain) {
    return null
  }

  if (projectName && sanitizedHost.endsWith(".vercel.app")) {
    const expectedSuffix = `-${projectName}.vercel.app`
    if (sanitizedHost.endsWith(expectedSuffix)) {
      const candidate = sanitizedHost.slice(0, -expectedSuffix.length)
      if (candidate && !candidate.includes(".")) {
        return candidate
      }
    }
  }

  if (sanitizedHost.endsWith(`.${normalizedRootDomain}`)) {
    const candidate = sanitizedHost.slice(0, -(normalizedRootDomain.length + 1))
    if (!candidate || candidate.includes(".")) {
      return null
    }
    return candidate
  }

  return null
}

export function toTenantLoginUrl(slug: string): string {
  const safeSlug = slug.trim().toLowerCase()
  const rootDomain = getRootDomain()
  const projectName = getProjectNameFromRootDomain(rootDomain)
  const isLocalDomain = rootDomain === "localhost" || rootDomain.startsWith("localhost:")

  if (isLocalDomain) {
    return `http://${safeSlug}.${rootDomain}/login`
  }

  if (projectName && rootDomain.endsWith("vercel.app")) {
    return `https://${safeSlug}-${projectName}.vercel.app/login`
  }

  return `https://${safeSlug}.${rootDomain}/login`
}
