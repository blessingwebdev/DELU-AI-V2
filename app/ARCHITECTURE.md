# DELU AI V2 Architecture

UI → DELU API routes → internal market service → normalized source adapters → verification engine.

The verification layer understands source families. NGX Equities, NGX Ticker and NGX Stock Chart Data are official NGX-family endpoints, while AFX and Yahoo are independent families. This prevents false claims of five independent providers.

Support automation is intentionally constrained to known low-risk issue patterns. Unknown or risky cases remain for owner attention.

Evolution proposals never auto-publish. The owner remains the release authority.
