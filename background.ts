export {}

console.log("🚀 Tab Grouper background script loaded!")

const tabCreationTimes = new Map<number, number>()

chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ Extension installed")
})

chrome.runtime.onStartup.addListener(() => {
  console.log("🔄 Extension started")
})

chrome.commands.onCommand.addListener((command) => {
  console.log("⌨️ Command triggered:", command)

  if (command === "group-tabs") {
    groupTabs()
  }
})

chrome.tabs.onCreated.addListener(async (tab) => {
  console.log("🆕 New tab created:", tab)

  if (tab.id) {
    tabCreationTimes.set(tab.id, Date.now())
  }

  const settings = await chrome.storage.sync.get([
    "autoGrouping"
  ])

  if (settings.autoGrouping === false) {
    return
  }

  setTimeout(() => {
    groupTabs()
  }, 2000)
})

chrome.runtime.onMessage.addListener(
  async (message, sender, sendResponse) => {
    if (message.type === "GROUP_TABS") {
      await groupTabs()

      sendResponse({
        success: true
      })
    }

    if (message.type === "GET_OLD_TABS") {
      const oldTabs = await getOldTabs()

      sendResponse({
        oldTabs
      })
    }

    if (message.type === "EXPORT_GROUPS") {
      await exportGroups()

      sendResponse({
        success: true
      })
    }

    return true
  }
)

const categories: Record<string, string[]> = {
  study: [
    "snuc.digiicampus.com",
    "lms.snuchennai.edu.in",
    "chatgpt.com",
    "claude.ai"
  ],

  social: [
    "facebook.com",
    "twitter.com",
    "instagram.com",
    "linkedin.com",
    "reddit.com"
  ],

  shopping: [
    "amazon.com",
    "ebay.com",
    "etsy.com",
    "flipkart.com"
  ],

  dev: [
    "github.com",
    "stackoverflow.com",
    "npmjs.com",
    "vercel.com",
    "netlify.com"
  ],

  video: [
    "youtube.com",
    "netflix.com",
    "twitch.tv"
  ]
}

async function groupTabs() {
  const settings = await chrome.storage.sync.get([
    "groupByCategory"
  ])

  if (settings.groupByCategory === false) {
    await groupTabsByDomain()

    return
  }

  await groupTabsByCategory()
}

async function groupTabsByCategory() {
  const tabs = await chrome.tabs.query({
    currentWindow: true
  })

  const categoryGroups = new Map<
    string,
    chrome.tabs.Tab[]
  >()

  tabs.forEach((tab) => {
    if (!tab.url) return

    const domain = getDomainFromUrl(tab.url)

    if (!domain) return

    const category = getCategoryForDomain(domain)

    if (!categoryGroups.has(category)) {
      categoryGroups.set(category, [])
    }

    categoryGroups.get(category)!.push(tab)
  })

  for (const [category, categoryTabs] of categoryGroups) {
    if (categoryTabs.length < 2) continue

    const tabIds = categoryTabs
      .map((t) => t.id!)
      .filter(Boolean)

    const groupId = await chrome.tabs.group({
      tabIds
    })

    await chrome.tabGroups.update(groupId, {
      title: category.toUpperCase(),
      color: getColorForCategory(category)
    })
  }
}

async function groupTabsByDomain() {
  const tabs = await chrome.tabs.query({
    currentWindow: true
  })

  const domainGroups = new Map<
    string,
    chrome.tabs.Tab[]
  >()

  tabs.forEach((tab) => {
    if (!tab.url) return

    const domain = getDomainFromUrl(tab.url)

    if (!domain) return

    if (!domainGroups.has(domain)) {
      domainGroups.set(domain, [])
    }

    domainGroups.get(domain)!.push(tab)
  })

  for (const [domain, domainTabs] of domainGroups) {
    if (domainTabs.length < 2) continue

    const tabIds = domainTabs
      .map((t) => t.id!)
      .filter(Boolean)

    const groupId = await chrome.tabs.group({
      tabIds
    })

    await chrome.tabGroups.update(groupId, {
      title: domain,
      color: getColorForCategory(domain)
    })
  }
}

async function getOldTabs() {
  const tabs = await chrome.tabs.query({})

  const sevenDaysAgo =
    Date.now() - 7 * 24 * 60 * 60 * 1000

  return tabs.filter((tab) => {
    const created = tabCreationTimes.get(tab.id!)

    return created && created < sevenDaysAgo
  })
}

async function exportGroups() {
  try {
    console.log("📦 Exporting groups...")

    const groups = await chrome.tabGroups.query({})

    const data = JSON.stringify(groups, null, 2)

    const dataUrl =
      "data:application/json;charset=utf-8," +
      encodeURIComponent(data)

    await chrome.downloads.download({
      url: dataUrl,
      filename: "tab-groups.json",
      saveAs: true
    })

    console.log("✅ Export completed")
  } catch (error) {
    console.error("❌ Export failed:", error)
  }
}

function getCategoryForDomain(domain: string): string {
  for (const [category, domains] of Object.entries(
    categories
  )) {
    if (domains.includes(domain)) {
      return category
    }
  }

  return "other"
}

function getDomainFromUrl(
  url: string
): string | null {
  try {
    const urlObj = new URL(url)

    if (
      urlObj.protocol === "chrome:" ||
      urlObj.protocol === "chrome-extension:"
    ) {
      return null
    }

    return urlObj.hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

function getColorForCategory(
  category: string
): chrome.tabGroups.ColorEnum {
  const categoryColors: Record<
    string,
    chrome.tabGroups.ColorEnum
  > = {
    study: "green",
    social: "pink",
    shopping: "yellow",
    dev: "blue",
    video: "red",
    other: "grey"
  }

  return categoryColors[category] || "grey"
}