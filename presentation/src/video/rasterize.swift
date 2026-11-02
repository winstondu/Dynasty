// Renders each page of a PDF to a 1920x1080 PNG.
import AppKit
import PDFKit

let args = CommandLine.arguments
guard args.count == 3, let doc = PDFDocument(url: URL(fileURLWithPath: args[1])) else {
    fatalError("usage: rasterize <in.pdf> <outdir>")
}
let size = NSSize(width: 1920, height: 1080)
for i in 0..<doc.pageCount {
    guard let page = doc.page(at: i) else { continue }
    let bounds = page.bounds(for: .mediaBox)
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(size.width), pixelsHigh: Int(size.height),
                               bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                               colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    let ctx = NSGraphicsContext(bitmapImageRep: rep)!
    NSGraphicsContext.current = ctx
    ctx.cgContext.setFillColor(NSColor.white.cgColor)
    ctx.cgContext.fill(CGRect(origin: .zero, size: size))
    ctx.cgContext.scaleBy(x: size.width / bounds.width, y: size.height / bounds.height)
    page.draw(with: .mediaBox, to: ctx.cgContext)
    NSGraphicsContext.restoreGraphicsState()
    let out = URL(fileURLWithPath: args[2]).appendingPathComponent(String(format: "slide-%02d.png", i + 1))
    try! rep.representation(using: .png, properties: [:])!.write(to: out)
}
print("rendered \(doc.pageCount) pages")
