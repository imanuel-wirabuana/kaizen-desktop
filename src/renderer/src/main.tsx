import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '@/providers/auth-provider'
import { App } from './App'
import './assets/globals.css'

// Safeguard against third-party DOM mutations (@dnd-kit node re-parenting vs React VDOM unmounts)
if (typeof window !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode && child.parentNode !== this) {
      return child.parentNode.removeChild(child) as T
    }
    return originalRemoveChild.call(this, child) as T
  }

  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(
    newNode: T,
    referenceNode: Node | null
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (referenceNode.parentNode) {
        return referenceNode.parentNode.insertBefore(newNode, referenceNode) as T
      }
      return this.appendChild(newNode) as T
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
)

