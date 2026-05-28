import { useState, useEffect } from "react"

function IndexPopup() {
  const [tabCount, setTabCount] = useState(0)
  const [groupCount, setGroupCount] = useState(0)
  const [isGrouping, setIsGrouping] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")

  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([])

  const [stats, setStats] = useState({
    totalTabs: 0,
    totalGroups: 0,
    mostUsedDomain: "",
    tabsToday: 0
  })

  useEffect(() => {
    console.log("Popup mounted")
    console.log("Chrome object:", chrome)

    loadStats()
  }, [])

  async function loadStats() {
    try {
      console.log("Loading stats...")

      const tabsData = await chrome.tabs.query({
        currentWindow: true
      })

      console.log("Tabs found:", tabsData)

      const groups = await chrome.tabGroups.query({
        windowId: chrome.windows.WINDOW_ID_CURRENT
      })

      console.log("Groups found:", groups)

      setTabs(tabsData)

      setTabCount(tabsData.length)
      setGroupCount(groups.length)

      const domainCount: Record<string, number> = {}

      tabsData.forEach((tab) => {
        if (!tab.url) return

        try {
          const hostname = new URL(tab.url).hostname

          domainCount[hostname] =
            (domainCount[hostname] || 0) + 1
        } catch {}
      })

      let mostUsedDomain = ""

      let maxCount = 0

      Object.entries(domainCount).forEach(
        ([domain, count]) => {
          if (count > maxCount) {
            maxCount = count
            mostUsedDomain = domain
          }
        }
      )

      setStats({
        totalTabs: tabsData.length,
        totalGroups: groups.length,
        mostUsedDomain,
        tabsToday: tabsData.length
      })

      console.log("Stats updated")
    } catch (error) {
      console.error("loadStats error:", error)
    }
  }

  async function handleGroupTabs() {
    try {
      console.log("Group button clicked")

      setIsGrouping(true)

      console.log("Sending message to background script...")

      const response = await chrome.runtime.sendMessage({
        type: "GROUP_TABS"
      })

      console.log("Background response:", response)

      console.log("Reloading stats...")

      await loadStats()

      console.log("Grouping complete")

      setIsGrouping(false)
    } catch (error) {
      console.error("handleGroupTabs error:", error)

      setIsGrouping(false)
    }
  }

  async function handleExport() {
    try {
      console.log("Exporting groups...")

      await chrome.runtime.sendMessage({
        type: "EXPORT_GROUPS"
      })

      console.log("Groups exported")
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  const filteredTabs = tabs.filter((tab) =>
    tab.title
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase())
  )

  return (
    <div
      style={{
        width: 340,
        padding: 20,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          🗂️ Tab Grouper
        </h2>

        <p
          style={{
            margin: "8px 0 0",
            fontSize: 13,
            color: "#666"
          }}>
          Smart browser workspace organizer
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20
        }}>
        <div
          style={{
            flex: 1,
            padding: 14,
            background: "#f5f5f5",
            borderRadius: 10
          }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700
            }}>
            {tabCount}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#666"
            }}>
            Open Tabs
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: 14,
            background: "#eef4ff",
            borderRadius: 10
          }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#0066ff"
            }}>
            {groupCount}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#666"
            }}>
            Groups
          </div>
        </div>
      </div>

      <div
        style={{
          marginBottom: 18
        }}>
        <input
          type="text"
          placeholder="🔍 Search open tabs..."
          value={searchQuery}
          onChange={(e) =>
            setSearchQuery(e.target.value)
          }
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ddd",
            outline: "none",
            fontSize: 13,
            boxSizing: "border-box"
          }}
        />
      </div>

      <div
        style={{
          maxHeight: 180,
          overflowY: "auto",
          marginBottom: 18,
          border: "1px solid #eee",
          borderRadius: 10
        }}>
        {filteredTabs.length === 0 ? (
          <div
            style={{
              padding: 16,
              fontSize: 13,
              color: "#777"
            }}>
            No matching tabs found
          </div>
        ) : (
          filteredTabs.map((tab) => (
            <div
              key={tab.id}
              style={{
                padding: 12,
                borderBottom: "1px solid #f0f0f0",
                fontSize: 13
              }}>
              <div
                style={{
                  fontWeight: 500,
                  marginBottom: 4
                }}>
                {tab.title}
              </div>

              <div
                style={{
                  color: "#777",
                  fontSize: 11
                }}>
                {tab.url}
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={handleGroupTabs}
        disabled={isGrouping}
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: 14,
          fontWeight: 600,
          color: "white",
          background: isGrouping ? "#ccc" : "#0066ff",
          border: "none",
          borderRadius: 10,
          cursor: isGrouping
            ? "not-allowed"
            : "pointer",
          transition: "0.2s",
          marginBottom: 10
        }}>
        {isGrouping
          ? "Grouping..."
          : "🗂️ Group Tabs"}
      </button>

      <button
        onClick={handleExport}
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: 14,
          fontWeight: 600,
          color: "white",
          background: "#222",
          border: "none",
          borderRadius: 10,
          cursor: "pointer",
          marginBottom: 20
        }}>
        ⬇️ Export Groups
      </button>

      <div
        style={{
          padding: 14,
          background: "#fff9e6",
          borderRadius: 10,
          border: "1px solid #ffe066",
          marginBottom: 16
        }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 6
          }}>
          📊 Browsing Statistics
        </div>

        <div
          style={{
            fontSize: 12,
            color: "#666",
            lineHeight: 1.8
          }}>
          <div>
            Total Tabs Today: {stats.tabsToday}
          </div>

          <div>
            Most Used Domain:{" "}
            {stats.mostUsedDomain || "N/A"}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: 12,
          fontSize: 12,
          color: "#666",
          background: "#f5f5f5",
          borderRadius: 10
        }}>
        💡 Press{" "}
        <strong>Ctrl + Shift + G</strong> to
        instantly group tabs.
      </div>
    </div>
  )
}

export default IndexPopup