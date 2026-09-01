import {
  BackgroundPicker,
  BackgroundPickerContent,
  BACKGROUND_PRESETS,
  type BackgroundPickerProps,
  type BackgroundPickerContentProps
} from '@/components/ui/background-picker'

export const LANE_BG_PRESETS = BACKGROUND_PRESETS

export function LaneBackgroundPickerContent(props: BackgroundPickerContentProps) {
  return <BackgroundPickerContent {...props} />
}

export function LaneBackgroundPicker(props: BackgroundPickerProps) {
  return <BackgroundPicker {...props} />
}
