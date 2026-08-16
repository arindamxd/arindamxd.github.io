---
title: "The class that turns a touch into an action — and the right place to start a custom control."
description: "UIControl is UIKit’s base class for buttons, sliders, and switches. It owns control events, control states, and target-action — the same surface you use when you subclass it."
banner: "/assets/blogs/ios-uicontrol-and-user-interaction/banner.jpg"
---

## What UIControl actually is

UIControl is a UIView subclass. You do not instantiate it directly. Apple treats it as an abstract subclassing point: system controls inherit from it, and you subclass it when you need a reusable interactive control of your own.

Common subclasses:

- **UIButton**: Taps. Primary action is usually a press that completes inside the bounds.
- **UISlider, UISwitch, UIStepper, UISegmentedControl, UIPageControl**: Value changes. Listen for `valueChanged`, not a tap.
- **UITextField**: Also a UIControl. Editing events (`editingDidBegin`, `editingChanged`, `editingDidEnd`) sit on the same event mask as button taps.
- **UIRefreshControl, UIDatePicker, UIColorWell**: Same dispatch path, different gestures.

UIView is for layout and drawing. UIControl is for a view that should speak target-action: discrete events, a bitmask of states, and `sendActions(for:)` when the value changes.

## Target-action, then UIAction

The control tracks the touch. Your code does not. You register a target, a selector, and a `UIControl.Event`. When that event fires, UIKit calls the method.

The older API still works, and Interface Builder still generates it:

```swift
saveButton.addTarget(self, action: #selector(didTapSave), for: .touchUpInside)

@objc private func didTapSave(_ sender: UIButton) {
    persist()
}
```

Two details from Apple’s docs that the selector version hides:

- **The control does not retain the target.** You keep the target alive (usually the view controller). If the target is gone, the action is a no-op.
- **A nil target walks the responder chain** until something implements the selector. Useful for first-responder actions; easy to misuse in a view hierarchy.

From iOS 14, prefer UIAction. No `@objc`, no selector, and the closure captures what it needs:

```swift
let saveButton = UIButton(type: .system)
saveButton.setTitle("Save", for: .normal)
saveButton.addAction(
    UIAction { [weak self] _ in
        self?.persist()
    },
    for: .primaryActionTriggered
)
```

Use `primaryActionTriggered` instead of `touchUpInside` when the control has a single “do the thing” action. Touch-up-inside only fires for a finger. Primary action also covers pointer click, hardware keyboard, and the semantic equivalent on other UIKit platforms.

UIButton initializers that take a `primaryAction` register that event for you. UIActions are uniqued by identifier: adding another action with the same id replaces the previous one.

## Events worth registering

`UIControl.Event` is a bitmask. You can OR values, and you can attach more than one target to the same control.

- **touchUpInside**: Finger went down inside, came up inside. Classic button. Misses keyboard and pointer unless you also handle those.
- **touchDown / touchDownRepeat**: Press started. Repeat is for a second tap while the first is still tracked.
- **touchDragInside / touchDragOutside / touchDragEnter / touchDragExit**: Finger moved relative to the control’s bounds. Sliders and press-and-hold chrome live here.
- **touchCancel**: System cancelled the touch (incoming call, gesture recognizer win). Reset highlights.
- **valueChanged**: Slider, switch, stepper, segmented control, and any custom control whose model changed.
- **primaryActionTriggered**: The control’s main action. Prefer this for buttons.
- **editingDidBegin / editingChanged / editingDidEnd / editingDidEndOnExit**: UITextField. End-on-exit is the Return key.

You do not need to listen to UIResponder `touchesBegan` on a stock UIButton. The control already collapsed those into events.

To fire the same path from code (tests, a programmatic toggle), call `sendActions(for:)`. That is also how a custom control notifies listeners after you update its value.

## States are a bitmask, not a single enum

`UIControl.State` is an OptionSet. A control can be selected and highlighted at the same time. `UIButton.setTitle(_:for:)`, `setImage`, and `setBackgroundImage` all take a state for that reason.

- **normal**: Enabled, idle. Raw value 0.
- **highlighted**: Finger is down. UIKit sets this during tracking; you usually do not.
- **disabled**: `isEnabled == false`. The control stops sending actions. VoiceOver reports it.
- **selected**: `isSelected == true`. Segmented controls and toggle-style buttons.
- **focused**: Keyboard or tvOS focus. Separate from highlighted.
- **application / reserved**: Bits Apple leaves for your subclass, and bits it keeps for itself.

Read the flags you set: `isEnabled`, `isSelected`, `isHighlighted`. During a touch you also get `isTracking` and `isTouchInside`. UIButton (iOS 15+) can restyle from state via `configurationUpdateHandler`; that still reads `button.state`, which is the same OptionSet.

## Subclassing: tracking methods, not UIResponder

Apple is explicit: if you subclass UIControl, override the tracking methods. Do not implement `touchesBegan` / `touchesMoved` / `touchesEnded`. Those skip `isTracking`, `isTouchInside`, and the default highlight behaviour.

- **beginTracking(_:with:)**: Touch entered the bounds. Set initial state. Return true to keep tracking (this updates `isTracking`); return false to stop.
- **continueTracking(_:with:)**: Finger moved. Return true to keep going.
- **endTracking(_:with:)**: Touch ended. The touch can be nil. Commit the value and send an event.
- **cancelTracking(with:)**: Touch was cancelled. Roll back highlight; do not commit.

If you subclass UIControl directly, you own drawing and layout. When the model changes, call `sendActions(for: .valueChanged)` so existing `addAction` / `addTarget` registrations fire.

A compact rating control:

```swift
final class RatingControl: UIControl {
    var value: Int = 0 {
        didSet {
            guard oldValue != value else { return }
            sendActions(for: .valueChanged)
            setNeedsDisplay()
        }
    }

    override func beginTracking(_ touch: UITouch, with event: UIEvent?) -> Bool {
        updateValue(from: touch)
        return true
    }

    override func continueTracking(_ touch: UITouch, with event: UIEvent?) -> Bool {
        updateValue(from: touch)
        return true
    }

    private func updateValue(from touch: UITouch) {
        let x = touch.location(in: self).x
        let star = Int((x / bounds.width) * 5) + 1
        value = min(5, max(1, star))
    }
}
```

Wire it like any system control:

```swift
rating.addAction(
    UIAction { action in
        guard let control = action.sender as? RatingControl else { return }
        print(control.value)
    },
    for: .valueChanged
)
```

Subviews inside a UIControl should usually have `isUserInteractionEnabled = false` so the control receives the touch. If the view needs nested tappable children (a card with its own buttons), it is a UIView with gesture recognizers, not a UIControl.

The other subclassing hook is `sendAction(_:to:for:)`. Override it on an existing control when you need to observe or rewrite dispatch — not to implement a new gesture.

## When not to use UIControl

- **One-off tap on a cell or card**: `UITapGestureRecognizer` (or a UIButton inside the cell). You do not need a control class.
- **Drawing without a discrete event**: UIView. Add a gesture if you must.
- **Nested interactive children**: UIControl tracking and child buttons fight. Use a view.
- **SwiftUI**: Button, Slider, Toggle. Wrap a UIControl in `UIViewRepresentable` only when you already have one.

Accessibility is not automatic because you subclassed UIControl. `isEnabled` is exposed; you still set `isAccessibilityElement`, traits (`.button`, `.adjustable`), a label, and `accessibilityValue` for the current rating or slider position.

Apple’s UIControl reference: https://developer.apple.com/documentation/uikit/uicontrol
