import { useEffect, useState } from "react"

function OptionsPage() {
  const [autoGrouping, setAutoGrouping] = useState(true)
  const [groupByCategory, setGroupByCategory] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const data = await chrome.storage.sync.get([
      "autoGrouping",
      "groupByCategory"
    ])

    if (data.autoGrouping !== undefined) {
      setAutoGrouping(data.autoGrouping)
    }

    if (data.groupByCategory !== undefined) {
      setGroupByCategory(data.groupByCategory)
    }
  }

  async function saveSettings(
    key: string,
    value: boolean
  ) {
    await chrome.storage.sync.set({
      [key]: value
    })
  }

  return (
    <div
      style={{
        padding: 24,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}
    >
      <h1>🗂️ Tab Grouper Settings</h1>

      <div style={{ marginTop: 20 }}>
        <label
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 16
          }}
        >
          <input
            type="checkbox"
            checked={autoGrouping}
            onChange={async (e) => {
              setAutoGrouping(e.target.checked)

              await saveSettings(
                "autoGrouping",
                e.target.checked
              )
            }}
          />

          Enable Auto Grouping
        </label>

        <label
          style={{
            display: "flex",
            gap: 10
          }}
        >
          <input
            type="checkbox"
            checked={groupByCategory}
            onChange={async (e) => {
              setGroupByCategory(e.target.checked)

              await saveSettings(
                "groupByCategory",
                e.target.checked
              )
            }}
          />

          Group By Category
        </label>
      </div>
    </div>
  )
}

export default OptionsPage