import GoogleSignIn

public let isCapacitorApp = true

public enum CapAppAuthURLHandler {
    @discardableResult
    public static func handle(_ url: URL) -> Bool {
        GIDSignIn.sharedInstance.handle(url)
    }
}
