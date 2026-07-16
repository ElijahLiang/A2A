import { useEffect } from 'react'
import { useGame } from '../domains/game'
import { useTownDialog } from '../domains/town'
import { LetterDialog } from '../domains/chat'
import { MapDialog } from '../components/MapDialog'
import { MapToolbar } from '../components/MapToolbar'
import { PixelMap } from '../components/PixelMap'
import { HomeDialog } from '../components/dialogs/HomeDialog'
import { IntentDialog } from '../components/dialogs/IntentDialog'
import { TownSquareDialog } from '../components/dialogs/TownSquareDialog'
import { CatActivityDialog } from '../components/dialogs/CatActivityDialog'
import { SeasonDialog } from '../components/dialogs/SeasonDialog'
import { BUILDINGS, INTENT_BUILDINGS, isIntentBuilding } from '../data/buildings'
import { MeetupDialog } from '../components/dialogs/MeetupDialog'
import { StampUnlockDialog } from '../components/dialogs/StampUnlockDialog'
import { Guide } from '../components/Guide'
import './TownMap.css'

export function TownMap({ onLogout }: { onLogout: () => void }) {
  const { plazaCats } = useGame()
  const dialog = useTownDialog()

  const activeConfig = dialog.activeBuilding
    ? BUILDINGS.find((building) => building.id === dialog.activeBuilding) ?? null
    : null

  useEffect(() => {
    if (!dialog.activeBuilding) return
    const key = 'a2a-hint-building'
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, '1')
    dialog.setHint('在建筑里可发布意图、收信或逛广场～')
    const t = window.setTimeout(() => dialog.setHint(null), 3200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog.activeBuilding])

  return (
    <div className="town-map-page">
      <div className="town-map-backdrop" />
      <div className="town-map-inner">
        <PixelMap
          buildings={BUILDINGS}
          cats={plazaCats}
          activeBuilding={dialog.activeBuilding}
          onBuildingClick={dialog.openBuilding}
          onCatClick={dialog.openCat}
          onAgentClick={dialog.openLetter}
          style={{ '--map-available-h': 'calc(100dvh - 70px - 12px)' } as React.CSSProperties}
        />

        {dialog.catDetail ? <CatActivityDialog cat={dialog.catDetail} onClose={dialog.closeCat} /> : null}
        {dialog.seasonOpen ? <SeasonDialog onClose={dialog.closeSeason} /> : null}
        {dialog.letterAgent ? (
          <LetterDialog agent={dialog.letterAgent} onClose={dialog.closeLetter} />
        ) : null}

        {dialog.oneShotHint ? (
          <div className="town-map-hint-toast pixel-card" role="status">
            {dialog.oneShotHint}
          </div>
        ) : null}

        {dialog.activeBuilding && activeConfig ? (
          isIntentBuilding(dialog.activeBuilding) ? (
            <MapDialog
              layout="bottom-sheet"
              title={INTENT_BUILDINGS[dialog.activeBuilding].title}
              icon={activeConfig.icon}
              subtitle={INTENT_BUILDINGS[dialog.activeBuilding].subtitle}
              onClose={dialog.closeBuilding}
            >
              <IntentDialog
                venueId={dialog.activeBuilding}
                activityType={INTENT_BUILDINGS[dialog.activeBuilding].activityType}
                activityLabel={INTENT_BUILDINGS[dialog.activeBuilding].title}
                onDone={dialog.closeBuilding}
              />
            </MapDialog>
          ) : dialog.activeBuilding === 'home' ? (
            <MapDialog
              title="公园"
              icon="🌳"
              subtitle="树荫、长椅与散步路线都在这里"
              onClose={dialog.closeBuilding}
            >
              <HomeDialog />
            </MapDialog>
          ) : dialog.activeBuilding === 'post_office' ? (
            <MapDialog
              title="许愿池"
              icon="💧"
              subtitle="在池边许愿，或捞起一条来自别人的心愿"
              onClose={dialog.closeBuilding}
            >
              <TownSquareDialog />
            </MapDialog>
          ) : (
            <MapDialog
              title="广场"
              icon="⛲"
              subtitle="镇中心的公共广场，适合驻足、会面和看看动态"
              onClose={dialog.closeBuilding}
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
        activeBuilding={dialog.activeBuilding}
        onOpenBuilding={dialog.openBuilding}
        onCloseBuilding={dialog.closeBuilding}
        onLogout={onLogout}
        onSeason={dialog.openSeason}
      />
    </div>
  )
}
