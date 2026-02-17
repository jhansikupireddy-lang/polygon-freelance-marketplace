# � PolyLance Animation System (v4)

Welcome to the Zenith Animation System. We use **Anime.js v4** integrated into React via a custom hook system for high-performance, GPU-accelerated UI transitions.

## 🚀 Quick Start

To use animations in any component:

```javascript
import { useAnimeAnimations } from '../hooks/useAnimeAnimations';

const MyComponent = () => {
  const { staggerFadeIn, slideInLeft } = useAnimeAnimations();
  const headerRef = useRef(null);

  useEffect(() => {
    // Single element animation
    if (headerRef.current) slideInLeft(headerRef.current);
    
    // Staggered list animation
    staggerFadeIn('.item-class', 100);
  }, []);

  return <h1 ref={headerRef}>Hello World</h1>;
};
```

## 🛠️ Reusable Hooks

### `useAnimeAnimations()`
Provides the core set of animation utilities:

- **Entrance Effects**:
  - `staggerFadeIn(selector, delay)`: Perfect for grid items or lists.
  - `slideInLeft(target, distance)` / `slideInRight`: Professional header entry.
  - `scaleIn(target)`: Growing effect for cards or modals.
  - `bounceIn(target)`: Elastic entry for alerts or primary actions.

- **Continuous Effects**:
  - `float(target, distance)`: Subtle levitation for highlighted elements.
  - `pulse(target, scale)`: Attention-grabbing rhythm.
  - `glitch(target)`: Cyberpunk tech effect for brands/stats.

- **Utilities**:
  - `countUp(el, target, duration)`: Smooth numeric interpolation.
  - `revealOnScroll(selector, threshold)`: Auto-animate as the user scrolls.
  - `magneticButton(ref)`: Button that follows the cursor (v4 specific).

### `useAnimeTimeline()`
For complex multi-step sequences:

```javascript
const { createTimeline } = useAnimeTimeline();

const tl = createTimeline();
tl.add('.step-1', { opacity: 1 })
  .add('.step-2', { x: 100 }, '+=200'); // relative offset
```

## ⚠️ Anime.js v4 Migration Notes

We have upgraded from v3 to **v4.3.6**. Key differences implemented in our hook:

1. **Named Exports**: Use `import { animate, stagger } from 'animejs'`.
2. **`animate` over `anime`**: The main function is now `animate(targets, params)`.
3. **`onRender`**: Use `onRender` instead of `update` for per-frame callbacks.
4. **Cleanup**: Use `remove(target)` to kill persistent animations on unmount.

## 🧪 Animation Showcase
You can view and test all animations in the **Showcase** section of the application sidebar.
