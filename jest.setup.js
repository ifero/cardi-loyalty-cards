/**
 * Jest Setup File
 * Story 2.2: Add Card Manually - Testing Setup
 */

// Built-in matchers are automatically available in @testing-library/react-native v12.4+

// Polyfill for TransformStream (required by expo)
if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = class TransformStream {};
}

// Polyfill for setImmediate and clearImmediate (required by React Native StatusBar)
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
}
if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = (id) => clearTimeout(id);
}

// Mock crypto.randomUUID (not available in jsdom)
// Set on both global and globalThis for compatibility
const mockUUID = '123e4567-e89b-12d3-a456-426614174000';

// Create a proper crypto mock that works in all environments
const mockCrypto = {
  randomUUID: jest.fn(() => mockUUID),
  getRandomValues: jest.fn((arr) => arr)
};

// Override crypto on both global and globalThis
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
  configurable: true
});

Object.defineProperty(globalThis, 'crypto', {
  value: mockCrypto,
  writable: true,
  configurable: true
});

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
  SQLiteDatabase: jest.fn()
}));

// Mock expo-sqlite/kv-store (used by features/settings)
const kvStoreData = {};
jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: {
    getItemSync: jest.fn((key) => kvStoreData[key] ?? null),
    setItemSync: jest.fn((key, value) => {
      kvStoreData[key] = value;
    }),
    removeItemSync: jest.fn((key) => {
      delete kvStoreData[key];
    }),
    clearSync: jest.fn(() => {
      Object.keys(kvStoreData).forEach((k) => delete kvStoreData[k]);
    })
  }
}));
// Expose kvStoreData for tests to inspect/reset
global.__kvStoreData = kvStoreData;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  const storage = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key) => Promise.resolve(storage[key] ?? null)),
      setItem: jest.fn((key, value) => {
        storage[key] = value;
        return Promise.resolve();
      }),
      removeItem: jest.fn((key) => {
        delete storage[key];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        Object.keys(storage).forEach((k) => delete storage[k]);
        return Promise.resolve();
      })
    }
  };
});

// Mock expo-splash-screen (Story 16.17).
//
// Two reasons this has to be mocked rather than transformed. It ships
// untranspiled ESM and the `expo` alternative in `transformIgnorePatterns` does
// not cover it (each alternative must be followed by `/`, so `expo/` never
// matches `expo-splash-screen/`). And even once transformed, its
// `import { isRunningInExpoGo } from 'expo'` drags in expo's side-effect chain
// (expo-asset → expo-modules-core EventEmitter), which does not survive this
// jsdom environment. On device every export no-ops safely when the native module
// is absent, so a no-op mock is faithful to real off-device behaviour.
//
// Suites that need to ASSERT on these calls (e.g. the splash strand guards in
// test/root-layout.splash-handoff.test.tsx) declare their own local factory,
// which overrides this one.
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
  hide: jest.fn(),
  setOptions: jest.fn()
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error'
  }
}));

// Mock burnt (toast notifications)
jest.mock('burnt', () => ({
  toast: jest.fn()
}));

// Mock @sentry/react-native (native module). The logger wrapper imports Sentry
// and routes production errors to captureException; mocking here keeps the
// native SDK out of the test runtime and lets tests assert on the wrapper.
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: jest.fn((component) => component),
  captureException: jest.fn(),
  captureMessage: jest.fn()
}));

// Mock expo-localization
jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'en-US', languageCode: 'en' }])
}));

// Mock expo-router
jest.mock('expo-router', () => {
  const push = jest.fn();
  const back = jest.fn();
  const replace = jest.fn();
  const setParams = jest.fn();
  const routerObj = { push, back, replace, setParams };

  return {
    router: routerObj,
    useRouter: () => routerObj,
    useLocalSearchParams: jest.fn(() => ({})),
    useNavigation: () => ({
      addListener: jest.fn(() => jest.fn()),
      dispatch: jest.fn()
    }),
    useFocusEffect: jest.fn((callback) => callback()),
    // A rendered screen is the focused one unless a test says otherwise (Story 22.10: Welcome).
    useIsFocused: jest.fn(() => true)
  };
});

// Mock @react-native-picker/picker
jest.mock('@react-native-picker/picker', () => {
  const mockReact = require('react');
  const mockRN = require('react-native');

  const MockPickerItem = ({ label, value }) => {
    return mockReact.createElement(
      mockRN.View,
      { testID: `picker-item-${value}` },
      mockReact.createElement(mockRN.Text, null, label)
    );
  };
  MockPickerItem.displayName = 'Picker.Item';

  const MockPicker = ({ selectedValue, children, testID }) => {
    return mockReact.createElement(
      mockRN.View,
      { testID: testID },
      mockReact.createElement(mockRN.Text, null, selectedValue),
      children
    );
  };
  MockPicker.Item = MockPickerItem;
  MockPicker.displayName = 'Picker';

  return {
    Picker: MockPicker
  };
});

// Mock lottie-react-native (Story 22.10): a native view, and the package ships no Jest mock. A View
// that takes every prop the player is given — `source`, `progress`, `loop`, the callbacks — so a
// test reads them off what it queried and calls `onAnimationFinish` or `onAnimationFailure` itself.
// Each player gets its own commands, handed to its ref as the real ones are and also set on the
// view as `commands`, so a test can see which player was told to play.
jest.mock('lottie-react-native', () => {
  const mockReact = require('react');
  const mockRN = require('react-native');

  const MockLottieView = mockReact.forwardRef((props, ref) => {
    const [commands] = mockReact.useState(() => ({
      play: jest.fn(),
      reset: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn()
    }));
    mockReact.useImperativeHandle(ref, () => commands, [commands]);
    return mockReact.createElement(mockRN.View, { ...props, commands });
  });
  MockLottieView.displayName = 'LottieView';

  return {
    __esModule: true,
    default: MockLottieView
  };
});

// Mock @expo/vector-icons (avoid expo-modules-core EventEmitter errors)
jest.mock('@expo/vector-icons', () => {
  const mockReact = require('react');
  const { Text } = require('react-native');
  const createMockIcon = (displayName) => {
    const Icon = ({ name, testID, ...rest }) =>
      mockReact.createElement(Text, { testID: testID || `icon-${name}`, ...rest }, name);
    Icon.displayName = displayName;
    return Icon;
  };
  return {
    MaterialIcons: createMockIcon('MaterialIcons'),
    MaterialCommunityIcons: createMockIcon('MaterialCommunityIcons'),
    Ionicons: createMockIcon('Ionicons'),
    FontAwesome: createMockIcon('FontAwesome')
  };
});

// Mock @shopify/flash-list
// Export state object to allow tests to capture props
global.mockFlashListState = {
  numColumns: undefined,
  contentContainerStyle: undefined,
  listHeaderStyle: undefined,
  refreshControl: undefined,
  keyboardShouldPersistTaps: undefined,
  maintainVisibleContentPosition: undefined
};
jest.mock('@shopify/flash-list', () => {
  const mockReact = require('react');
  const mockRN = require('react-native');

  return {
    FlashList: (props) => {
      const {
        data,
        renderItem,
        ListEmptyComponent,
        ListHeaderComponent,
        testID,
        numColumns,
        refreshControl,
        keyboardShouldPersistTaps,
        maintainVisibleContentPosition,
        contentContainerStyle
      } = props;

      // Store list-level props in global state for test assertions.
      // contentContainerStyle matters because FlashList measures its grid cells
      // from a probe view INSIDE this padded container, so the padding is part of
      // the cell-width arithmetic, not just decoration (Story 16.22).
      global.mockFlashListState.numColumns = numColumns;
      global.mockFlashListState.contentContainerStyle = contentContainerStyle;
      // The header is an element, not a component, when a caller passes JSX. Capture
      // its style so tests can assert the header's own padding — it shares the padded
      // content container with the grid but has no per-cell wrapper of its own.
      global.mockFlashListState.listHeaderStyle =
        ListHeaderComponent && typeof ListHeaderComponent !== 'function'
          ? ListHeaderComponent.props?.style
          : undefined;
      // A custom refresh control replaces FlashList's built-in one (which takes no tint), so
      // tests read its handler and colours here. Captured rather than forwarded onto the host
      // view: an element there would make `toJSON()` circular through its owner fiber.
      global.mockFlashListState.refreshControl = refreshControl;
      // Forwarded by FlashList to its scroll view, so it decides whether a tap while the keyboard
      // is up reaches the header's controls and the tiles.
      global.mockFlashListState.keyboardShouldPersistTaps = keyboardShouldPersistTaps;
      // FlashList 2 anchors the first visible item across data changes unless this disables it.
      global.mockFlashListState.maintainVisibleContentPosition = maintainVisibleContentPosition;

      const renderSlot = (Slot) =>
        typeof Slot === 'function' ? mockReact.createElement(Slot) : Slot;

      const children = data.map((item, index) =>
        mockReact.createElement(mockRN.View, { key: item.id || index }, renderItem({ item }))
      );

      // FlashList 2.0.2 renders the header whether or not there is data, and the empty
      // component AFTER the (empty) item collection, inside the same scroll view
      // (`recyclerview/hooks/useSecondaryProps.tsx`, `recyclerview/RecyclerView.tsx`). This
      // mock used to return the empty component on its own, dropping the header, so a
      // search that matched nothing could not be tested with its controls still on screen.
      return mockReact.createElement(
        mockRN.View,
        { testID },
        ListHeaderComponent
          ? mockReact.createElement(
              mockRN.View,
              { key: '__header' },
              renderSlot(ListHeaderComponent)
            )
          : null,
        ...children,
        data.length === 0 && ListEmptyComponent ? renderSlot(ListEmptyComponent) : null
      );
    }
  };
});

// Mock uuid (ESM module, needs to be mocked for Jest)
jest.mock('uuid', () => ({
  v4: jest.fn(() => '123e4567-e89b-12d3-a456-426614174000')
}));

require('./shared/i18n');

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const mockReact = require('react');
  const mockRN = require('react-native');

  // A shared value, with the `.value` accessor and the `get`/`set` pair. `useSharedValue` keeps
  // ONE for the life of the component, as the real hook does — an effect that lists a shared
  // value must not re-run on every render. A write notifies what reads it: the reactions below.
  let mockReadsInProgress = null;
  const makeMutable = (initial) => {
    let current = initial;
    const readers = new Set();
    const read = () => {
      mockReadsInProgress?.add(readers);
      return current;
    };
    const write = (next) => {
      current = next;
      [...readers].forEach((reader) => reader());
    };
    return {
      get value() {
        return read();
      },
      set value(next) {
        write(next);
      },
      get: read,
      set: (next) => write(typeof next === 'function' ? next(current) : next)
    };
  };
  const useSharedValue = (initial) => mockReact.useState(() => makeMutable(initial))[0];

  // A port of Reanimated's `interpolate` (src/interpolation.ts), so scroll-linked values computed
  // in a worklet come out in a test exactly as they do on the device.
  const Extrapolation = { IDENTITY: 'identity', CLAMP: 'clamp', EXTEND: 'extend' };
  const extrapolate = (type, coef, val, leftEdgeOutput, rightEdgeOutput, x) => {
    switch (type) {
      case Extrapolation.IDENTITY:
        return x;
      case Extrapolation.CLAMP:
        return coef * val < coef * leftEdgeOutput ? leftEdgeOutput : rightEdgeOutput;
      case Extrapolation.EXTEND:
      default:
        return val;
    }
  };
  const interpolate = (x, inputRange, outputRange, type) => {
    if (inputRange.length < 2 || outputRange.length < 2) {
      throw new Error('Interpolation input and output ranges should contain at least two values.');
    }
    const config =
      typeof type === 'string'
        ? { extrapolateLeft: type, extrapolateRight: type }
        : {
            extrapolateLeft: type?.extrapolateLeft ?? Extrapolation.EXTEND,
            extrapolateRight: type?.extrapolateRight ?? Extrapolation.EXTEND
          };
    const length = inputRange.length;
    let segment = length - 1;
    if (x <= inputRange[length - 1]) {
      let left = 1;
      let right = length - 1;
      while (left < right) {
        const mid = Math.floor((left + right) / 2);
        if (x <= inputRange[mid]) {
          right = mid;
        } else {
          left = mid + 1;
        }
      }
      segment = left;
    }
    const leftEdgeInput = inputRange[segment - 1];
    const rightEdgeInput = inputRange[segment];
    const leftEdgeOutput = outputRange[segment - 1];
    const rightEdgeOutput = outputRange[segment];
    if (rightEdgeInput - leftEdgeInput === 0) {
      return leftEdgeOutput;
    }
    const progress = (x - leftEdgeInput) / (rightEdgeInput - leftEdgeInput);
    const val = leftEdgeOutput + progress * (rightEdgeOutput - leftEdgeOutput);
    const coef = rightEdgeOutput >= leftEdgeOutput ? 1 : -1;
    if (coef * val < coef * leftEdgeOutput) {
      return extrapolate(config.extrapolateLeft, coef, val, leftEdgeOutput, rightEdgeOutput, x);
    }
    if (coef * val > coef * rightEdgeOutput) {
      return extrapolate(config.extrapolateRight, coef, val, leftEdgeOutput, rightEdgeOutput, x);
    }
    return val;
  };

  // Scroll. The offset `useScrollOffset` returns is kept per animated ref, and `Animated.ScrollView`
  // writes every scroll event's offset into the one registered for its ref, as the real hook's
  // event handler does. `useAnimatedScrollHandler` hands its worklets to the same scroll view,
  // which calls each with the event's payload and the handler's context — one object for the life
  // of the hook, shared by all its events, as Reanimated's `useHandler` keeps it — and `scrollTo`
  // moves the offset at once.
  const mockScrollOffsets = new WeakMap();
  const useAnimatedRef = () => mockReact.useRef(null);
  const useScrollOffset = (animatedRef, providedOffset) => {
    const internalOffset = useSharedValue(0);
    const offset = mockReact.useRef(providedOffset ?? internalOffset).current;
    if (animatedRef) {
      mockScrollOffsets.set(animatedRef, offset);
    }
    return offset;
  };
  const useAnimatedScrollHandler = (handlers) => ({
    mockScrollHandlers: typeof handlers === 'function' ? { onScroll: handlers } : handlers,
    mockScrollContext: mockReact.useRef({}).current
  });
  const scrollTo = jest.fn((animatedRef, _x, y) => {
    mockScrollOffsets.get(animatedRef)?.set(y);
  });

  const SCROLL_EVENTS = [
    ['onScroll', 'onScroll'],
    ['onScrollBeginDrag', 'onBeginDrag'],
    ['onScrollEndDrag', 'onEndDrag'],
    ['onMomentumScrollBegin', 'onMomentumBegin'],
    ['onMomentumScrollEnd', 'onMomentumEnd']
  ];
  const AnimatedScrollView = mockReact.forwardRef((props, ref) => {
    const workletHandlers = props.onScroll?.mockScrollHandlers;
    const workletContext = props.onScroll?.mockScrollContext;
    const eventProps = Object.fromEntries(
      SCROLL_EVENTS.map(([prop, worklet]) => [
        prop,
        (event) => {
          const y = event?.nativeEvent?.contentOffset?.y;
          if (typeof y === 'number') {
            mockScrollOffsets.get(ref)?.set(y);
          }
          workletHandlers?.[worklet]?.(event?.nativeEvent ?? {}, workletContext);
          // `onScroll` IS the worklet handlers' carrier when there are any; every other prop is a
          // plain JS listener and still hears its event.
          if (prop !== 'onScroll' || !workletHandlers) {
            props[prop]?.(event);
          }
        }
      ])
    );
    return mockReact.createElement(mockRN.ScrollView, { ...props, ...eventProps, ref });
  });
  AnimatedScrollView.displayName = 'Animated.ScrollView';

  // Runs `react` with what `prepare` returns, and again whenever a shared value `prepare` read is
  // written. Always the latest callbacks, read from a ref, so a re-render never re-subscribes.
  const useAnimatedReaction = (prepare, react) => {
    const latest = mockReact.useRef({ prepare, react });
    latest.current = { prepare, react };
    mockReact.useEffect(() => {
      let previous = null;
      let subscriptions = [];
      const run = () => {
        subscriptions.forEach((readers) => readers.delete(run));
        const reads = new Set();
        const outer = mockReadsInProgress;
        mockReadsInProgress = reads;
        let prepared;
        try {
          prepared = latest.current.prepare();
        } finally {
          mockReadsInProgress = outer;
        }
        subscriptions = [...reads];
        subscriptions.forEach((readers) => readers.add(run));
        latest.current.react(prepared, previous);
        previous = prepared;
      };
      run();
      return () => subscriptions.forEach((readers) => readers.delete(run));
    }, []);
  };

  const AnimatedView = mockReact.forwardRef((props, ref) =>
    mockReact.createElement(mockRN.View, { ...props, ref })
  );
  AnimatedView.displayName = 'Animated.View';

  const Animated = {
    View: AnimatedView,
    Text: mockRN.Text,
    Image: mockRN.Image,
    ScrollView: AnimatedScrollView,
    FlatList: mockRN.FlatList
  };

  const createAnimationMock = () => ({
    duration: () => createAnimationMock(),
    delay: () => createAnimationMock(),
    easing: () => createAnimationMock(),
    springify: () => createAnimationMock(),
    damping: () => createAnimationMock(),
    stiffness: () => createAnimationMock()
  });

  return {
    __esModule: true,
    default: Animated,
    FadeIn: createAnimationMock(),
    FadeOut: createAnimationMock(),
    SlideInUp: createAnimationMock(),
    SlideOutUp: createAnimationMock(),
    useSharedValue,
    useAnimatedStyle: () => ({}),
    useAnimatedRef,
    useScrollOffset,
    useAnimatedScrollHandler,
    useAnimatedReaction,
    scrollTo,
    interpolate,
    Extrapolation,
    // Completes at once, reporting `finished: true` as the real callback does (false = cancelled).
    withTiming: (value, _config, callback) => {
      if (callback) callback(true);
      return value;
    },
    withDelay: (_delay, value) => value,
    withRepeat: (value) => value,
    withSpring: (value) => value,
    cancelAnimation: jest.fn(),
    useReducedMotion: () => false,
    runOnJS: (fn) => fn,
    Easing: {
      inOut: (fn) => fn,
      // The shared BottomSheet slides on `Easing.out(Easing.ease)` (Story 22.1).
      out: (fn) => fn,
      ease: 'ease',
      linear: (v) => v
    }
  };
});

// Mock react-native-worklets: app code uses only `scheduleOnRN`, which runs a JS-thread function
// from a UI-thread callback — an animation's end (the shared BottomSheet's slide-out, and the
// Tile's report that its highlight ring has ended) and card detail's midpoint flip, from a
// `useAnimatedReaction` (Story 22.3). It runs at once, as the Reanimated mock above completes its
// animations and runs its reactions at once. The package's own `src/mock` is not used: it is
// TypeScript that `transformIgnorePatterns` leaves untransformed, and it replaces
// `globalThis.requestAnimationFrame` in every suite that loads it.
jest.mock('react-native-worklets', () => ({
  scheduleOnRN: (fn, ...args) => {
    fn(...args);
  }
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const mockReact = require('react');
  const mockRN = require('react-native');

  return {
    GestureHandlerRootView: ({ children, style }) =>
      mockReact.createElement(mockRN.View, { style, testID: 'gesture-root' }, children),
    GestureDetector: ({ children }) =>
      mockReact.createElement(mockRN.View, { testID: 'gesture-detector' }, children),
    Gesture: {
      Pan: () => ({
        onUpdate: function () {
          return this;
        },
        onEnd: function () {
          return this;
        }
      })
    }
  };
});

// Mock NetInfo native module
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn().mockResolvedValue({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
      details: null
    }),
    addEventListener: jest.fn(() => jest.fn())
  }
}));

// Mock react-native-unistyles (Story 16.1). The official mock replaces the
// native Nitro module and resolves themed `StyleSheet.create` calls against the
// first-registered theme. Requiring `unistyles` afterwards runs
// `StyleSheet.configure` against the mock registry, so `useUnistyles().theme`
// and themed styles resolve to the real `light` theme values in tests.
require('react-native-unistyles/mocks');
require('./shared/theme/unistyles');

// Mock expo-clipboard to avoid ESM parse issues in Jest
jest.mock('expo-clipboard', () => ({
  __esModule: true,
  setStringAsync: jest.fn().mockResolvedValue(undefined),
  getStringAsync: jest.fn().mockResolvedValue('')
}));

// Mock expo-brightness to avoid ESM parse issues in Jest (some native modules export ESM)
jest.mock('expo-brightness', () => ({
  __esModule: true,
  getBrightnessAsync: jest.fn().mockResolvedValue(1),
  setBrightnessAsync: jest.fn().mockResolvedValue(undefined)
}));

// Clear mock calls after each test to prevent leakage (do not restore spies defined at top-level)
afterEach(() => {
  jest.clearAllMocks();
});

// Silence console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Animated') || args[0].includes('useNativeDriver'))
  ) {
    return;
  }
  originalWarn(...args);
};
