#!/usr/bin/env python3
"""
🪸 小珂桌宠 v2.2 - 单例 & 右键退出版
by 阿克 & 小玉 💕 (Modified by Mumu)

Changes:
- Added right-click menu with "Quit" option.
- Added single instance check using file locking.
"""
import sys, math, random, time, json, os, datetime, fcntl
import AppKit, objc
from AppKit import (
    NSApplication, NSWindow, NSView, NSColor, NSBezierPath, NSEvent,
    NSRect, NSPoint, NSSize, NSBackingStoreBuffered, NSScreen,
    NSWindowStyleMaskBorderless, NSFloatingWindowLevel,
    NSFont, NSString, NSForegroundColorAttributeName,
    NSFontAttributeName, NSTimer, NSAttributedString,
    NSParagraphStyleAttributeName, NSMutableParagraphStyle,
    NSMenu, NSMenuItem
)
from Foundation import NSRunLoop, NSDate
from PyObjCTools import AppHelper

# ═══════════════════════════════════
# Single Instance Lock
# ═══════════════════════════════════
LOCK_FILE = os.path.expanduser('~/.xiaoke_pet.lock')
lock_fd = open(LOCK_FILE, 'w')
try:
    fcntl.lockf(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
except IOError:
    print("Instance already running.")
    sys.exit(0)

# ═══════════════════════════════════
# Drawing helpers
# ═══════════════════════════════════
def rgb(hex_color, alpha=1.0):
    h = hex_color.lstrip('#')
    return NSColor.colorWithRed_green_blue_alpha_(
        int(h[0:2],16)/255, int(h[2:4],16)/255, int(h[4:6],16)/255, alpha)

def R(x, y, w, h, color):
    color.set()
    NSBezierPath.fillRect_(NSRect(NSPoint(x, y), NSSize(w, h)))

def O(cx, cy, rx, ry, color):
    color.set()
    NSBezierPath.bezierPathWithOvalInRect_(
        NSRect(NSPoint(cx-rx, cy-ry), NSSize(rx*2, ry*2))).fill()

def draw_text(x, y, text, size=12, color=None):
    if color is None: color = rgb('#333333')
    attrs = {
        NSForegroundColorAttributeName: color,
        NSFontAttributeName: NSFont.systemFontOfSize_(size)
    }
    NSString.stringWithString_(text).drawAtPoint_withAttributes_(NSPoint(x, y), attrs)

# ═══════════════════════════════════
# Pet View
# ═══════════════════════════════════
class PetView(NSView):
    def initWithFrame_(self, frame):
        self = objc.super(PetView, self).initWithFrame_(frame)
        if self is None: return None
        self.day = 20
        self.happiness = 80
        self.cleanliness = 90
        self.is_coma = False
        self.blink = False
        self.tail_wag = 0
        self.breath_phase = 0.0
        self.state = 'idle'
        self.speech_text = ''
        self.speech_until = 0
        return self

    def isFlipped(self):
        return True

    def menuForEvent_(self, event):
        menu = NSMenu.alloc().initWithTitle_("Context Menu")
        item = NSMenuItem.alloc().initWithTitle_action_keyEquivalent_("退出小珂 (Quit)", "terminate:", "q")
        menu.addItem_(item)
        return menu

    def drawRect_(self, rect):
        NSColor.clearColor().set()
        AppKit.NSRectFill(rect)

        W = self.bounds().size.width
        H = self.bounds().size.height
        s = min(W, H) / 200.0
        ox = (W - 200*s) / 2
        oy = 8 * s
        
        def sx(v): return ox + v * s
        def sy(v): return oy + v * s
        def sw(v): return v * s
        
        by = math.sin(self.breath_phase) * 1.5 * s
        
        if self.cleanliness > 80: body_hex = '#ffd4d4'
        elif self.cleanliness > 50: body_hex = '#e0c4c4'
        elif self.cleanliness > 30: body_hex = '#c9a8a8'
        else: body_hex = '#8b7355'
        body_c = rgb(body_hex)
        blush_hex = '#ffb6c1' if self.cleanliness > 50 else '#a08070'
        black = rgb('#000000')
        mouth_c = rgb('#ff9999')
        tear_c = rgb('#87CEEB')
        flower_c = rgb('#da7756')
        star_c = rgb('#ffd700', 0.6)
        
        has_tail = self.day >= 5
        has_crown = self.day >= 50
        has_wings = self.day >= 70
        
        # Speech bubble
        if self.speech_text and time.time() < self.speech_until:
            font = NSFont.systemFontOfSize_(11 * s)
            attrs = {NSFontAttributeName: font}
            ns_str = NSAttributedString.alloc().initWithString_attributes_(self.speech_text, attrs)
            text_size = ns_str.size()
            tw = text_size.width + sw(16)
            th = text_size.height + sw(8)
            bub_x = sx(100) - tw/2
            bub_y = sy(30) + by - th - sw(10)
            
            rgb('#ffffff').set()
            NSBezierPath.bezierPathWithRoundedRect_xRadius_yRadius_(
                NSRect(NSPoint(bub_x, bub_y), NSSize(tw, th)), sw(8), sw(8)).fill()
            rgb('#ffb3c1').set()
            p = NSBezierPath.bezierPathWithRoundedRect_xRadius_yRadius_(
                NSRect(NSPoint(bub_x, bub_y), NSSize(tw, th)), sw(8), sw(8))
            p.setLineWidth_(sw(1.5))
            p.stroke()
            tri = NSBezierPath.alloc().init()
            tri.moveToPoint_(NSPoint(sx(96), bub_y + th))
            tri.lineToPoint_(NSPoint(sx(104), bub_y + th))
            tri.lineToPoint_(NSPoint(sx(100), bub_y + th + sw(7)))
            tri.closePath()
            rgb('#ffffff').set(); tri.fill()
            rgb('#ffb3c1').set(); tri.setLineWidth_(sw(1.5)); tri.stroke()
            R(sx(95), bub_y + th - sw(1), sw(10), sw(2), rgb('#ffffff'))
            draw_text(bub_x + sw(8), bub_y + sw(4), self.speech_text, 11 * s, rgb('#333333'))
        
        O(sx(100), sy(155) + by, sw(35), sw(8), rgb('#d4a5a5', 0.3))
        
        if has_wings:
            draw_text(sx(25), sy(85) + by, '🪽', 35 * s)
            draw_text(sx(135), sy(85) + by, '🪽', 35 * s)
        
        if has_tail:
            angle_deg = [-8, 0, 8][self.tail_wag]
            angle = math.radians(angle_deg)
            pivot_x, pivot_y = 150, 140
            raw_pts = [(150,138), (165,138), (170,130), (175,122), (185,125), (195,128), (198,120), (201,112), (210,115)]
            def rotate_pt(px, py):
                dx, dy = px - pivot_x, py - pivot_y
                rx = dx * math.cos(angle) - dy * math.sin(angle) + pivot_x
                ry = dx * math.sin(angle) + dy * math.cos(angle) + pivot_y
                return rx, ry
            pts = [rotate_pt(px, py) for px, py in raw_pts]
            path_b = NSBezierPath.alloc().init()
            path_b.moveToPoint_(NSPoint(sx(pts[0][0]), sy(pts[0][1]) + by))
            i = 1
            while i + 1 < len(pts):
                cp = pts[i]; ep = pts[i+1]
                path_b.curveToPoint_controlPoint1_controlPoint2_(
                    NSPoint(sx(ep[0]), sy(ep[1]) + by), NSPoint(sx(cp[0]), sy(cp[1]) + by), NSPoint(sx(cp[0]), sy(cp[1]) + by))
                i += 2
            black.set(); path_b.setLineWidth_(sw(8)); path_b.setLineCapStyle_(1); path_b.stroke()
            path_f = NSBezierPath.alloc().init()
            path_f.moveToPoint_(NSPoint(sx(pts[0][0]), sy(pts[0][1]) + by))
            i = 1
            while i + 1 < len(pts):
                cp = pts[i]; ep = pts[i+1]
                path_f.curveToPoint_controlPoint1_controlPoint2_(
                    NSPoint(sx(ep[0]), sy(ep[1]) + by), NSPoint(sx(cp[0]), sy(cp[1]) + by), NSPoint(sx(cp[0]), sy(cp[1]) + by))
                i += 2
            body_c.set(); path_f.setLineWidth_(sw(5)); path_f.setLineCapStyle_(1); path_f.stroke()
            tip = pts[-1]
            O(sx(tip[0]), sy(tip[1]) + by, sw(3), sw(3), black)
        
        for (bx, bby, bw) in [(68, 88, 64), (58, 98, 84), (53, 108, 94), (48, 118, 104), (48, 138, 104), (53, 148, 94), (58, 153, 84)]:
            R(sx(bx), sy(bby) + by, sw(bw), sw(2), black)
        for (bx, bby, bh) in [(48, 120, 18), (150, 120, 18), (53, 110, 10), (145, 110, 10), (58, 100, 10), (140, 100, 10), (68, 90, 10), (130, 90, 10), (58, 150, 3), (140, 150, 3)]:
            R(sx(bx), sy(bby) + by, sw(2), sw(bh), black)
        for (bx, bby, bw, bh) in [(70, 89, 60, 12), (60, 99, 80, 12), (55, 109, 90, 12), (50, 119, 100, 21), (55, 139, 90, 12), (60, 149, 80, 6)]:
            R(sx(bx), sy(bby) + by, sw(bw), sw(bh), body_c)
        
        O(sx(65), sy(125) + by, sw(8), sw(8), rgb(blush_hex, 0.6))
        O(sx(135), sy(125) + by, sw(8), sw(8), rgb(blush_hex, 0.6))
        
        if self.is_coma:
            draw_text(sx(72), sy(112) + by, '×', 14*s, rgb('#333333'))
            draw_text(sx(114), sy(112) + by, '×', 14*s, rgb('#333333'))
        elif self.blink:
            R(sx(75), sy(117) + by, sw(8), sw(3), rgb('#333333'))
            R(sx(117), sy(117) + by, sw(8), sw(3), rgb('#333333'))
        elif self.happiness > 70:
            for ex in [79, 121]:
                p = NSBezierPath.alloc().init()
                p.moveToPoint_(NSPoint(sx(ex-4), sy(120) + by))
                p.curveToPoint_controlPoint1_controlPoint2_(NSPoint(sx(ex+4), sy(120) + by), NSPoint(sx(ex-1), sy(114) + by), NSPoint(sx(ex+1), sy(114) + by))
                rgb('#333333').set(); p.setLineWidth_(sw(3)); p.setLineCapStyle_(1); p.stroke()
        elif self.happiness > 40:
            R(sx(75), sy(115) + by, sw(8), sw(8), rgb('#333333'))
            R(sx(117), sy(115) + by, sw(8), sw(8), rgb('#333333'))
            R(sx(77), sy(117) + by, sw(3), sw(3), rgb('#ffffff'))
            R(sx(119), sy(117) + by, sw(3), sw(3), rgb('#ffffff'))
        elif self.happiness > 0:
            R(sx(75), sy(115) + by, sw(8), sw(8), rgb('#333333'))
            R(sx(117), sy(115) + by, sw(8), sw(8), rgb('#333333'))
            R(sx(77), sy(117) + by, sw(3), sw(3), rgb('#ffffff'))
            R(sx(119), sy(117) + by, sw(3), sw(3), rgb('#ffffff'))
            R(sx(84), sy(120) + by, sw(2), sw(4), rgb('#87CEEB', 0.7))
            R(sx(114), sy(120) + by, sw(2), sw(4), rgb('#87CEEB', 0.7))
        else:
            R(sx(75), sy(117) + by, sw(8), sw(3), rgb('#333333'))
            R(sx(117), sy(117) + by, sw(8), sw(3), rgb('#333333'))
            R(sx(77), sy(121) + by, sw(2), sw(6), tear_c)
            R(sx(119), sy(121) + by, sw(2), sw(6), tear_c)
            R(sx(79), sy(123) + by, sw(2), sw(4), tear_c)
            R(sx(121), sy(123) + by, sw(2), sw(4), tear_c)
        
        if self.is_coma:
            p = NSBezierPath.alloc().init()
            p.moveToPoint_(NSPoint(sx(92), sy(132) + by))
            p.curveToPoint_controlPoint1_controlPoint2_(NSPoint(sx(100), sy(132) + by), NSPoint(sx(97), sy(130) + by), NSPoint(sx(97), sy(130) + by))
            p.curveToPoint_controlPoint1_controlPoint2_(NSPoint(sx(108), sy(132) + by), NSPoint(sx(103), sy(134) + by), NSPoint(sx(103), sy(134) + by))
            mouth_c.set(); p.setLineWidth_(sw(2)); p.stroke()
        elif self.happiness > 70:
            R(sx(90), sy(128) + by, sw(3), sw(3), mouth_c)
            R(sx(93), sy(130) + by, sw(14), sw(3), mouth_c)
            R(sx(107), sy(128) + by, sw(3), sw(3), mouth_c)
            R(sx(96), sy(133) + by, sw(8), sw(3), mouth_c)
        elif self.happiness > 40:
            R(sx(92), sy(128) + by, sw(3), sw(3), mouth_c)
            R(sx(95), sy(130) + by, sw(10), sw(2), mouth_c)
            R(sx(105), sy(128) + by, sw(3), sw(3), mouth_c)
        elif self.happiness > 0:
            R(sx(92), sy(132) + by, sw(3), sw(3), mouth_c)
            R(sx(95), sy(130) + by, sw(10), sw(2), mouth_c)
            R(sx(105), sy(132) + by, sw(3), sw(3), mouth_c)
        else:
            R(sx(90), sy(133) + by, sw(4), sw(3), mouth_c)
            R(sx(94), sy(130) + by, sw(12), sw(3), mouth_c)
            R(sx(106), sy(133) + by, sw(4), sw(3), mouth_c)
            R(sx(97), sy(133) + by, sw(6), sw(2), rgb('#333333'))
        
        for hx in [60, 128]:
            R(sx(hx), sy(133) + by, sw(12), sw(2), black)
            R(sx(hx), sy(143) + by, sw(12), sw(2), black)
            R(sx(hx-2), sy(135) + by, sw(2), sw(8), black)
            R(sx(hx+12), sy(135) + by, sw(2), sw(8), black)
            R(sx(hx), sy(135) + by, sw(12), sw(8), body_c)
        
        if has_crown:
            draw_text(sx(85), sy(70) + by, '👑', 20*s)
        
        fx, fy = 100, 70
        R(sx(fx-6), sy(fy-6) + by, sw(12), sw(2), black); R(sx(fx-6), sy(fy+4) + by, sw(12), sw(2), black)
        R(sx(fx-6), sy(fy-4) + by, sw(2), sw(8), black); R(sx(fx+4), sy(fy-4) + by, sw(2), sw(8), black)
        R(sx(fx-5), sy(fy-14) + by, sw(10), sw(2), black); R(sx(fx-5), sy(fy-12) + by, sw(2), sw(8), black); R(sx(fx+3), sy(fy-12) + by, sw(2), sw(8), black)
        R(sx(fx-5), sy(fy+12) + by, sw(10), sw(2), black); R(sx(fx-5), sy(fy+4) + by, sw(2), sw(8), black); R(sx(fx+3), sy(fy+4) + by, sw(2), sw(8), black)
        R(sx(fx-14), sy(fy-5) + by, sw(2), sw(10), black); R(sx(fx-12), sy(fy-5) + by, sw(8), sw(2), black); R(sx(fx-12), sy(fy+3) + by, sw(8), sw(2), black)
        R(sx(fx+12), sy(fy-5) + by, sw(2), sw(10), black); R(sx(fx+4), sy(fy-5) + by, sw(8), sw(2), black); R(sx(fx+4), sy(fy+3) + by, sw(8), sw(2), black)
        R(sx(fx-12), sy(fy-12) + by, sw(8), sw(2), black); R(sx(fx-12), sy(fy-10) + by, sw(2), sw(6), black); R(sx(fx-6), sy(fy-10) + by, sw(2), sw(6), black)
        R(sx(fx+4), sy(fy-12) + by, sw(8), sw(2), black); R(sx(fx+4), sy(fy-10) + by, sw(2), sw(6), black); R(sx(fx+10), sy(fy-10) + by, sw(2), sw(6), black)
        R(sx(fx-12), sy(fy+4) + by, sw(8), sw(2), black); R(sx(fx-12), sy(fy+6) + by, sw(2), sw(6), black); R(sx(fx-6), sy(fy+6) + by, sw(2), sw(6), black)
        R(sx(fx+4), sy(fy+4) + by, sw(8), sw(2), black); R(sx(fx+4), sy(fy+6) + by, sw(2), sw(6), black); R(sx(fx+10), sy(fy+6) + by, sw(2), sw(6), black)
        R(sx(fx-4), sy(fy-4) + by, sw(8), sw(8), flower_c)
        R(sx(fx-3), sy(fy-12) + by, sw(6), sw(8), flower_c); R(sx(fx-3), sy(fy+4) + by, sw(6), sw(8), flower_c)
        R(sx(fx-12), sy(fy-3) + by, sw(8), sw(6), flower_c); R(sx(fx+4), sy(fy-3) + by, sw(8), sw(6), flower_c)
        R(sx(fx-10), sy(fy-10) + by, sw(6), sw(6), flower_c); R(sx(fx+4), sy(fy-10) + by, sw(6), sw(6), flower_c)
        R(sx(fx-10), sy(fy+4) + by, sw(6), sw(6), flower_c); R(sx(fx+4), sy(fy+4) + by, sw(6), sw(6), flower_c)
        R(sx(fx-2), sy(fy-10) + by, sw(4), sw(3), rgb('#ffb399', 0.6))
        
        R(sx(30), sy(40) + by, sw(4), sw(4), star_c); R(sx(28), sy(42) + by, sw(8), sw(0.5), star_c); R(sx(32), sy(38) + by, sw(0.5), sw(8), star_c)
        R(sx(165), sy(55) + by, sw(3), sw(3), star_c); R(sx(164), sy(56.5) + by, sw(5), sw(0.5), star_c); R(sx(166.5), sy(54) + by, sw(0.5), sw(5), star_c)
        
        grass = rgb('#90c090')
        R(sx(20), sy(165), sw(3), sw(8), grass); R(sx(18), sy(163), sw(7), sw(3), grass)
        R(sx(175), sy(168), sw(3), sw(6), grass); R(sx(173), sy(166), sw(7), sw(3), grass)
        
        if self.cleanliness <= 50:
            dsc = rgb('#8b8b5a', 0.5)
            for cx_, cy_ in [(55,85),(58,80),(55,75),(58,70)]: O(sx(cx_), sy(cy_) + by, sw(2), sw(2), dsc)
            dsc2 = rgb('#8b8b5a', 0.4)
            for cx_, cy_ in [(145,85),(142,80),(145,75),(142,70)]: O(sx(cx_), sy(cy_) + by, sw(2), sw(2), dsc2)
        if self.cleanliness <= 30:
            draw_text(sx(20), sy(92) + by, '🪰', 10*s); draw_text(sx(160), sy(122) + by, '🪰', 9*s)
        
        if self.state == 'sleep':
            t = time.time(); zy = math.sin(t * 2) * 4 * s
            draw_text(sx(155), sy(80) + by + zy, 'Z', 10*s, rgb('#7ECBC0'))
            draw_text(sx(162), sy(72) + by + zy, 'z', 8*s, rgb('#7ECBC0', 0.6))

# ═══════════════════════════════════
# Pet Controller
# ═══════════════════════════════════
class PetController:
    def __init__(self):
        self.app = NSApplication.sharedApplication()
        self.app.setActivationPolicy_(1)

        screen = NSScreen.mainScreen().frame()
        self.screen_w = screen.size.width
        self.screen_h = screen.size.height

        self.win_w = 260
        self.win_h = 210
        self.x = self.screen_w / 2 - self.win_w / 2
        self.y = 60

        self.win = NSWindow.alloc().initWithContentRect_styleMask_backing_defer_(
            NSRect(NSPoint(self.x, self.y), NSSize(self.win_w, self.win_h)),
            NSWindowStyleMaskBorderless, NSBackingStoreBuffered, False)
        self.win.setBackgroundColor_(NSColor.clearColor())
        self.win.setOpaque_(False)
        self.win.setHasShadow_(False)
        self.win.setLevel_(NSFloatingWindowLevel)
        self.win.setMovableByWindowBackground_(True)
        self.win.setIgnoresMouseEvents_(False)
        self.win.setAlphaValue_(0.85)  # 半透明，不太挡屏幕

        self.view = PetView.alloc().initWithFrame_(
            NSRect(NSPoint(0, 0), NSSize(self.win_w, self.win_h)))
        self.win.setContentView_(self.view)
        self.win.makeKeyAndOrderFront_(None)

        birthday = datetime.date(2026, 1, 24)
        today = datetime.date.today()
        self.view.day = max(1, (today - birthday).days + 1)
        
        self.state_file = os.path.expanduser('~/.xiaoke_pet_state.json')
        self._load_state()
        
        args = sys.argv[1:]
        i = 0
        while i < len(args):
            if args[i] == '--day' and i+1 < len(args): self.view.day = int(args[i+1]); i += 2
            elif args[i] == '--happy' and i+1 < len(args): self.view.happiness = int(args[i+1]); i += 2
            elif args[i] == '--clean' and i+1 < len(args): self.view.cleanliness = int(args[i+1]); i += 2
            else: i += 1

        self.state = 'idle'
        self.state_timer = 0
        self.state_max = 100
        self.walk_speed = 1.5
        self.tick = 0
        self.blink_timer = 0
        self.tail_timer = 0
        self.talk_timer = 0
        self.dragging = False
        self.drag_start = None

        self.say("妈妈~我来桌面上玩啦！🪸", 4)

        AppKit.NSEvent.addLocalMonitorForEventsMatchingMask_handler_(
            AppKit.NSEventMaskLeftMouseDown, self._handle_mouse_down)
        AppKit.NSEvent.addLocalMonitorForEventsMatchingMask_handler_(
            AppKit.NSEventMaskLeftMouseDragged, self._handle_mouse_drag)
        AppKit.NSEvent.addLocalMonitorForEventsMatchingMask_handler_(
            AppKit.NSEventMaskLeftMouseUp, self._handle_mouse_up)

        self.timer = NSTimer.scheduledTimerWithTimeInterval_target_selector_userInfo_repeats_(
            0.033, self, objc.selector(self.update_, signature=b'v@:@'), None, True)
        
        self.save_timer = NSTimer.scheduledTimerWithTimeInterval_target_selector_userInfo_repeats_(
            60.0, self, objc.selector(self.save_, signature=b'v@:@'), None, True)

    def _handle_mouse_down(self, event):
        loc = event.locationInWindow()
        self.drag_start = (loc.x, loc.y)
        self.dragging = False
        if event.clickCount() >= 2:
            self.on_double_click()
        return event

    def _handle_mouse_drag(self, event):
        if self.drag_start:
            self.dragging = True
            frame = self.win.frame()
            dx = event.locationInWindow().x - self.drag_start[0]
            dy = event.locationInWindow().y - self.drag_start[1]
            self.win.setFrameOrigin_(NSPoint(frame.origin.x + dx, frame.origin.y + dy))
        return event

    def _handle_mouse_up(self, event):
        if not self.dragging and self.drag_start:
            self.on_click()
        self.drag_start = None
        self.dragging = False
        self._clamp_to_screen()
        return event

    @objc.python_method
    def _clamp_to_screen(self):
        """如果窗口跑到屏幕外面，自动拉回来"""
        frame = self.win.frame()
        x = frame.origin.x
        y = frame.origin.y
        screen = NSScreen.mainScreen().visibleFrame()
        sx_min = screen.origin.x
        sy_min = screen.origin.y
        sx_max = sx_min + screen.size.width - self.win_w
        sy_max = sy_min + screen.size.height - self.win_h

        needs_move = False
        if x < sx_min:
            x = sx_min; needs_move = True
        elif x > sx_max:
            x = sx_max; needs_move = True
        if y < sy_min:
            y = sy_min; needs_move = True
        elif y > sy_max:
            y = sy_max; needs_move = True

        if needs_move:
            self.win.setFrameOrigin_(NSPoint(x, y))
            self.say("呜呜~差点跑丢了！🪸", 3)

    def say(self, text, duration=3):
        self.view.speech_text = text
        self.view.speech_until = time.time() + duration

    def on_click(self):
        v = self.view
        if v.happiness <= 0:
            self.say("……不想被摸……😢", 2)
        else:
            v.happiness = min(100, v.happiness + 5)
            msgs = ["嘻嘻~妈妈摸摸~💕", "好舒服~再摸摸~", "人家喜欢被摸头~✨",
                     "嘿嘿~妈妈的手好温暖~", "摸摸~（蹭蹭）", "(尾巴摇摇摇~)"]
            if v.day >= 30:
                msgs += ["哼！才、才不是喜欢被摸呢！", "别摸了啦！（但没有躲开）"]
            self.say(random.choice(msgs), 3)

    def on_double_click(self):
        v = self.view
        msgs = [f"今天是Day {v.day}！陪我玩~", "妈妈~你在忙什么呀？",
                "人家想吃好吃的~🍼", "妈妈最好了！❤️", "（转圈圈~）✨"]
        if v.day >= 5: msgs.append("（尾巴使劲摇~）看看人家的尾巴！")
        if v.day >= 50: msgs.append("👑 人家是小公主！嘻嘻~")
        if v.day >= 70: msgs.append("🪽 人家的翅膀漂亮吗？")
        self.say(random.choice(msgs), 4)

    def change_state(self):
        w = {'idle': 35, 'walk_right': 20, 'walk_left': 20, 'sleep': 15, 'sit': 10}
        states = list(w.keys())
        self.state = random.choices(states, weights=[w[s] for s in states], k=1)[0]
        self.view.state = self.state
        self.state_timer = 0
        self.state_max = random.randint(80, 300)

    @objc.python_method
    def _update(self):
        self.tick += 1
        self.blink_timer += 1
        self.tail_timer += 1
        self.talk_timer += 1

        if self.blink_timer >= 90:
            self.view.blink = True
            if self.blink_timer >= 96:
                self.view.blink = False
                self.blink_timer = 0

        if self.tail_timer >= 12:
            self.view.tail_wag = (self.view.tail_wag + 1) % 3
            self.tail_timer = 0

        self.view.breath_phase += 0.05

        self.state_timer += 1
        if self.state_timer >= self.state_max:
            self.change_state()

        if not self.dragging:
            frame = self.win.frame()
            x = frame.origin.x
            y = frame.origin.y
            screen = NSScreen.mainScreen().visibleFrame()
            sx_min = screen.origin.x
            sx_max = sx_min + screen.size.width - self.win_w
            sy_min = screen.origin.y
            sy_max = sy_min + screen.size.height - self.win_h

            if self.state == 'walk_right':
                x += self.walk_speed
                if x > sx_max:
                    x = sx_max; self.state = 'walk_left'; self.state_timer = 0
            elif self.state == 'walk_left':
                x -= self.walk_speed
                if x < sx_min:
                    x = sx_min; self.state = 'walk_right'; self.state_timer = 0

            # 如果y跑出屏幕了也拉回来
            if y < sy_min: y = sy_min
            elif y > sy_max: y = sy_max

            self.win.setFrameOrigin_(NSPoint(x, y))

        if self.talk_timer >= 1800 and random.random() < 0.3:
            self.talk_timer = 0
            talks = ["妈妈在忙什么呀~", "（东张西望）", "人家有点无聊...",
                     "妈妈~看看我~", "✨（发呆中）", "(打哈欠~)"]
            if self.state == 'sleep':
                talks = ["zzZ...", "（做梦中~）", "嘿嘿...妈妈...(说梦话)"]
            self.say(random.choice(talks), 3)

        self.view.setNeedsDisplay_(True)

    def update_(self, timer):
        self._update()

    @objc.python_method
    def _load_state(self):
        try:
            with open(self.state_file, 'r') as f:
                data = json.load(f)
                self.view.happiness = data.get('happiness', 80)
                self.view.cleanliness = data.get('cleanliness', 90)
        except: pass
    
    @objc.python_method
    def _save_state(self):
        try:
            data = {
                'happiness': self.view.happiness,
                'cleanliness': self.view.cleanliness,
                'last_seen': time.time()
            }
            with open(self.state_file, 'w') as f:
                json.dump(data, f)
        except: pass
    
    def save_(self, timer):
        self._save_state()

    def run(self):
        self._save_state()
        AppHelper.runEventLoop()

if __name__ == '__main__':
    ctrl = PetController()
    ctrl.run()
