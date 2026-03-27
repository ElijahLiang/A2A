import { useEffect, useState } from 'react'
import { useGame } from '../contexts/GameContext'
import { MapDialog } from '../components/MapDialog'
import { MapToolbar } from '../components/MapToolbar'
import { PixelMap } from '../components/PixelMap'
import { HomeDialog } from '../components/dialogs/HomeDialog'
import { IntentDialog } from '../components/dialogs/IntentDialog'
import { PostOfficeDialog } from '../components/dialogs/PostOfficeDialog'
import { TownSquareDialog } from '../components/dialogs/TownSquareDialog'
import { CatActivityDialog } from '../components/dialogs/CatActivityDialog'
import { SeasonDialog } from '../components/dialogs/SeasonDialog'
import { type BuildingId } from '../components/Building'
import type { SquareCat } from '../types'
import { BUILDINGS, INTENT_BUILDINGS, isIntentBuilding } from '../data/buildings'
import { MeetupDialog } from '../components/dialogs/MeetupDialog'
import { StampUnlockDialog } from '../components/dialogs/StampUnlockDialog'
import { Guide } from '../components/Guide'
import './TownMap.css'

export function TownMap({ onLogout }: { onLogout: () => void }) {
  const { plazaCats } = useGame()
  const [activeBuilding, setActiveBuilding] = useState<BuildingId | null>(null)
  const [catDetail, setCatDetail] = useState<SquareCat | null>(null)
  const [seasonOpen, setSeasonOpen] = useState(false)
  const [oneShotHint, setOneShotHint] = useState<string | null>(null)

  const activeConfig = activeBuilding
    ? BUILDINGS.find((building) => building.id === activeBuilding) ?? null
    : null

  const closeDialog = () => setActiveBuilding(null)

  useEffect(() => {
    if (!activeBuilding) return
    const key = 'a2a-hint-building'
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, '1')
    setOneShotHint('在建筑里可发布意图、收信或逛广场～')
    const t = window.setTimeout(() => setOneShotHint(null), 3200)
    return () => clearTimeout(t)
  }, [activeBuilding])

  return (
    <div className="town-map-page">
      <div className="town-map-backdrop" />
      <div className="town-map-inner">

        {/*
          --map-available-h: 可用高度 = 视口高度 - 工具栏 - 顶部 padding - 地图标题 sign
          减去 70px = 18px HUD + 52px tabs + 10px padding
        */}
        <PixelMap
          buildings={BUILDINGS}
          cats={plazaCats}
          activeBuilding={activeBuilding}
          onBuildingClick={setActiveBuilding}
          onCatClick={(c: SquareCat) => setCatDetail(c)}
          style={{ '--map-available-h': 'calc(100dvh - 70px - 12px)' } as React.CSSProperties}
        />

        {catDetail ? <CatActivityDialog cat={catDetail} onClose={() => setCatDetail(null)} /> : null}
        {seasonOpen ? <SeasonDialog onClose={() => setSeasonOpen(false)} /> : null}

        {oneShotHint ? (
          <div className="town-map-hint-toast pixel-card" role="status">
            {oneShotHint}
          </div>
        ) : null}

        {activeBuilding && activeConfig ? (
          isIntentBuilding(activeBuilding) ? (
            <MapDialog
              layout="bottom-sheet"
              title={INTENT_BUILDINGS[activeBuilding].title}
              icon={activeConfig.icon}
              subtitle={INTENT_BUILDINGS[activeBuilding].subtitle}
              onClose={closeDialog}
            >
              <IntentDialog
                venueId={activeBuilding}
                activityType={INTENT_BUILDINGS[activeBuilding].activityType}
                activityLabel={INTENT_BUILDINGS[activeBuilding].title}
                onDone={closeDialog}
              />
            </MapDialog>
          ) : activeBuilding === 'home' ? (
            <MapDialog
              title="我的档案"
              icon="👤"
              subtitle="查看 Big Five 画像、性格标签与社交偏好"
              onClose={closeDialog}
            >
              <HomeDialog />
            </MapDialog>
          ) : activeBuilding === 'post_office' ? (
            <MapDialog
              title="信箱"
              icon="📮"
              subtitle="接收匹配通知，查看详细邀约报告"
              onClose={closeDialog}
            >
              <PostOfficeDialog />
            </MapDialog>
          ) : (
            <MapDialog
              title="城镇广场"
              icon="⛲"
              subtitle="浏览全镇正在进行中的匹配与邀约"
              onClose={closeDialog}
            >
              <TownSquareDialog />
            </MapDialog>
          )
        ) : null}

      </div>

      <MeetupDialog />
      <StampUnlockDialog />
      <Guide />

      <MapToolbar
        activeBuilding={activeBuilding}
        onOpenBuilding={setActiveBuilding}
        onCloseBuilding={closeDialog}
        onLogout={onLogout}
        onSeason={() => setSeasonOpen(true)}
      />
    </div>
  )
}
