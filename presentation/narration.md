# Dynasty talk: narration

About 17 minutes of narration (roughly 2,400 words), plus time for questions. The same text is in each slide's speaker notes.

## 1. Linked by nobody, loaded on first use

Hi everyone. I want to show you a small library called Dynasty. The whole idea fits on this slide: feature code ships as frameworks that live inside the app bundle, but nobody links them. The app only links the protocols. Each framework is loaded the first time somebody calls into it, and three Swift macros write the wiring so the compiler checks it instead of a string. If you want to see those loads happen, there's an optional logger that times each one. I'll start with why you'd want this, look at how Meta solved the same problem, then walk through the pattern, the real code from the demo app, and what happens under the hood on that first call.

## 2. Everything you link is paid for before main()

Let's start with how an iOS app gets code from another binary. Most of us only ever use the two on this slide. Static linking copies the feature into the executable, so it's simply part of the app. Dynamic linking records a load command, and dyld maps, rebases and binds that framework before main runs, on every launch. In both cases, look at where the cost lands on the timeline: before main. It doesn't matter whether this session ever touches the feature. And that's the quiet tax that grows with every feature you add. Everything you link, every user pays for, at launch.

## 3. Dynamic loading: map it when a feature needs it

There's a third option, and it's the one people reach for least: dynamic loading. The framework still ships inside the app, but nothing references it at launch, so nothing extra happens before main. The first time a feature calls in, you dlopen it and it gets mapped right then. That gives you three things. It's off the launch path. If a session never uses the feature, that framework is never mapped at all. And if the framework is somehow missing, the call fails rather than the launch; the app still starts. So why is this the least used of the three? Because the raw API is nothing but strings and casts. Let me show you.

## 4. Raw dlopen is strings and casts

So here's what it actually takes if you do it by hand, with nothing but dlopen and a shared protocol. On the plugin side, up top, you export a C function and you pick a name for it: "create_animal". And notice that little comment: Mouse has to be a class here, because Unmanaged only works with objects. On the host side, you build the path to the framework yourself, you dlopen it, you dlsym that same name, you bit-cast the pointer into a function type, call it, and finally force-cast whatever comes back to Animal. And all this complicated stuff that gives you a headache, the compiler can't check any of it. Misspell the symbol, change the function's signature, bundle two copies of the interface: it all still builds, and you find out at runtime, usually as a crash. You write it all again, plus error handling, at every call site.

## 5. Meta hit the same wall and built infrastructure

We're not the first ones to hit this. Meta wrote up the evolution of the Facebook iOS app, and it's worth reading. In 2016, pre-main time had grown with every product, so they moved product code into lazily loaded dylibs. That worked, but it broke things like NSClassFromString, and every call site had to name the right dylib by hand. By 2018 they'd fixed that with infrastructure: Buck's build graph generated a symbol-to-dylib map, and on top of it a plugin system that the build validated. And they're honest about the cost. Errors that are hard to search for, code that doesn't look like normal iOS code, and a generated registry nobody can find. So the question we asked was: can we get the 2018 result with nothing but stock Swift and Xcode?

## 6. Three roles, one macro each

Here's our answer. Three roles, and each one is marked by a single macro. First, the interface: a protocol with DyLibInterface on it. It ships as one dynamic library that the app and every plugin link, and that "one" is going to matter later. Second, the plugin: a type that implements the protocol, marked with DyLibExport. It's embedded in the app bundle, but nobody links it and the app never imports it. Third, the connection: an empty enum with DyLibConnect, naming the interface and the framework. That gives you a typed handle to the plugin, and it works in the app or inside another plugin. That's the entire surface for the common case. No registry, no manager, no identifier strings, and no symbol name anywhere in your code.

## 7. Implementations are embedded, never linked

This is how it lands in the demo app's bundle. Everything on this slide ends up in the app's Frameworks folder, so the question isn't where they are; it's whether the app binary references them. The bottom row is linked: the two interfaces, the shared logger and the runtime. dyld loads those before main, one copy each, shared by the app and whichever plugins use them. The top row is the four implementations. They're embedded, but the app never links or imports them; it only names them as a string in a connection, like the Mouse one at the top. They get opened by dlopen the first time their connection is used. And notice the arrow on the right: Cat and Dog each have their own connection to Trick, so plugins can lazily load other plugins.

## 8. An interface and a plugin, complete

Now the actual code, straight from the demo. On the left is the whole interface module. A protocol with one method, and the DyLibInterface macro on top. That macro generates two things: AnimalPluginSpec, which knows how to load and check an Animal plugin, and AnimalLazyProxy, which is itself an Animal and loads the real one on first use. On the right is a complete plugin, the Mouse framework. It imports the interface, conforms to it, and adds DyLibExport. That generates the C entry point, so there's no handwritten cdecl and no string. And if Mouse ever stops conforming to Animal, this file doesn't compile.

## 9. The host connects by type, not by symbol

And here's the host side, from the demo's ViewController. One connection: the interface type, the framework name, and an optional logger. That's an empty enum called MousePlugin. Notice there's no symbol anywhere; you name a type and a framework, and that's it. The button handler just asks for MousePlugin.instance and hands it to show. That instance is the lazy proxy, and it is an Animal, so the rest of your code doesn't know or care that it's a plugin. Creating the proxy loads nothing. The first speak call is what opens the framework, and every tap after that hits the cache. The logger argument is optional. Leave it out and nothing gets logged; we'll come back to it.

## 10. Mouse and its host derive the same entry symbol

Let's open these macros up, because this is where the trick is. Top row is the plugin side. That one attribute on Mouse expands into a C function named __dylib_entry_Animal, and it wraps a factory that returns a Mouse as any Animal. Bottom row is the host side. The connection expands into a lazy plugin typed on AnimalPluginSpec, with our DebugLogger, and an instance property that hands back the lazy proxy. And the part I want you to see is that comment at the bottom: AnimalPluginSpec's symbol name is also __dylib_entry_Animal. Both sides derive it from the protocol name and the version. Nobody types it, so the host's dlsym and the plugin's export can't drift apart. If you're curious, Xcode will show you all of this with Editor, Expand Macro.

## 11. A plugin can lazily load another plugin

And it composes. A connection works anywhere, including inside a plugin. Follow the arrows: the app taps Run Cat, so the Cat framework is opened and speak is called. Cat's speak calls TrickPlugin.instance.perform, and that's exactly the same machinery one level down. Cat has its own connection, so on first use it opens the Trick framework, finds __dylib_entry_Trick, and gets a Backflip. Backflip is on the bottom left, and it's as small as Mouse was. The console shows both loads in order, and then the combined answer: Meow, and does a backflip. Nothing links Trick, not the app and not Cat. Cat just declares a connection the way the app does. And Mouse has no connection, so tapping Mouse never loads Trick at all.

## 12. What happens on MousePlugin.instance.speak()

So what actually happens on that first speak call? Five steps. One: the call goes to the proxy, which is stateless; creating it loaded nothing. Two: the proxy asks the lazy plugin, which takes the connection's lock, so if two threads make the first call at the same time, they collapse into one load. Three: the loader opens the image, and any declared dependencies first, in topological order. One detail we were careful about: the loader never holds its own lock across dlopen, because image initializers may take locks of their own. Four: dlsym looks up the derived symbol, confined to that image only. Five: the header gets validated, the factory is called, and the instance is cached. And if anything fails, say the framework is missing, the failure isn't cached. The next call just retries.

## 13. Five checks before the host trusts a plugin

Step five deserves its own slide, because once an image is open we still trust nothing in it. Every entry point returns a pointer to this fixed C header. Only those sixteen bytes cross as C data; the box underneath isn't touched as Swift until the header passes. Then we walk the ladder on the right. The symbol has to be present in that image. The first field has to be the magic value, DYLB. The ABI version has to match the runtime's. The spec type's metadata has to be identical to the host's. And finally the value has to cast to the protocol. Each rung has its own named error, so a wrong or stale plugin fails loudly with a reason, instead of getting called through a stale witness table.

## 14. One copy of every shared module per process

There's one rule you can't break, and that fourth check is what enforces it. Every interface module, and the runtime itself, must be one dynamic library, embedded once and shared by the app and every plugin. Never statically. The reason is that Swift type identity is metadata identity, not the spelling of the name. If a plugin and the host each copy the interface in statically, you get two AnimalPluginSpec metadata records with the same name, and a value crossing that boundary isn't the type the host thinks it is. That's the silent corruption case. The identity check turns it into an immediate specTypeMismatch. In Package.swift it's one line: type dynamic on every interface product.

## 15. Add a logger to see every load and what it cost

Lazy loading is great right up until you want to know when a load happened and what it cost. So a connection can optionally take a DyLibLoadLogger. It's a type, not an instance, which makes it an ordinary compile-time argument, same as the interface. This is the demo's DebugLogger, in full. It takes the framework name off the path, formats the duration in milliseconds, says ok or prints the error, and it only does anything in Debug builds. It lives in its own DemoLogging framework because both the app and the plugins use it, which is the golden rule again. Wire it in on the Mouse connection, tap Run Mouse, and you get that one line in the console, followed by Squeak.

## 16. Honest numbers, zero cost when unused

A few semantics we were deliberate about. You get one event per real load; cache hits are silent, and because failures aren't cached, every retry logs its own event. didLoad fires on success and on failure, so even a load that's about to trap a non-throwing call gets logged first. The duration is on the monotonic uptime clock, from the first call to a usable instance, covering dlopen, the symbol lookup, validation and the factory. Leave the logger out and the connection expands exactly as before and never reads a clock. One warning: callbacks run outside the loader's lock but inside the connection's own, so a logger must not call back into the connection it's logging. And since it's a type per connection, there's no global logger; each connection picks its own.

## 17. Tap, watch the console, then break it on purpose

Let's put it all together in the demo app. Launch it: nothing loads, because only the interfaces, DemoLogging and the runtime are linked. Tap Run Cat and you get two lines: Cat loads, then Cat's own Trick connection loads Trick. Tap Cat again: nothing. Cache hit. Now tap Run Dog, and you get Dog, and then Trick again. Dog has its own Trick connection, so that connection logs its own first load; but the loader finds the image already resident and skips dlopen entirely, so that second timing is just lookup, validation and the factory. Then the experiment worth doing: delete CatImplementation from a simulator build. The app still launches. Tap Run Cat and the logger prints the failedToOpen error; then, because speak can't throw, the proxy traps. If you need to handle a missing plugin gracefully, call try CatPlugin.loadIfNeeded first. And for contrast, delete AnimalInterface, and the app can't launch at all, because dyld requires every linked framework.

## 18. Allowed, because every plugin ships in the bundle

The question I always get: is this allowed? Yes, and the line is clear. Guideline 2.5.2 says apps have to be self-contained and can't download or execute code that changes features. We only use public APIs, dlopen, dlsym and dlclose, on frameworks that are built, signed and embedded in the app you submit, so App Review sees every byte. Choosing when to load, lazily on first use, is fine. Choosing which bundled plugin to load, say behind a feature flag, is fine. Downloading a framework after install, patching shipped binaries, or using plugins to hide features from review: not allowed. And on a real device the kernel enforces code signing, so a modified or swapped framework simply won't load. The simulator is more lenient, so don't mistake simulator tampering for something that works in production.

## 19. Off the launch path, checked by the compiler

So, to wrap up. Feature code comes off the launch path. Macros replace the strings, so the compiler checks the wiring. The runtime validates every boundary with named errors. And when you want it, a logger reports every lazy load and what it cost. It's Meta's 2018 idea with nothing but stock Swift: one connection, one line to call it, and dlopen happens right there. The code's on GitHub under winstondu/DyLibRuntimeLoader, and the demo app is in the Demo folder if you want to tap through it yourself. Happy to take questions.
