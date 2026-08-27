import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import {
  breadcrumbFromView,
  useBreadcrumbStore,
  type BreadcrumbItem as BreadcrumbItemData
} from '@/stores/dynamic-breadcrumb'
import { useNavigationStore } from '@/stores/navigation'
import { Fragment } from 'react'

export function DynamicBreadcrumb() {
  const navigate = useNavigationStore((s) => s.navigate)
  const currentView = useNavigationStore((s) => s.currentView)
  const customItems = useBreadcrumbStore((s) => s.items)

  const items: BreadcrumbItemData[] =
    customItems.length > 0 ? customItems : breadcrumbFromView(currentView)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const targetView = item.view

          return (
            <Fragment key={`${item.label}-${index}`}>
              <BreadcrumbItem className={index === 0 && items.length > 1 ? 'hidden md:inline-flex' : ''}>
                {targetView && !isLast ? (
                  <BreadcrumbLink
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault()
                      navigate(targetView)
                    }}
                  >
                    {item.label}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLast && (
                <BreadcrumbSeparator className={index === 0 ? 'hidden md:inline-flex' : ''} />
              )}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export default DynamicBreadcrumb


