Privacy Policy and Terms of Use – Iris Auth Lite
Last Updated: October 17, 2025

Overview
--------
Iris Auth Lite is designed for fully offline iris capture, enhancement, and verification. This document explains how we handle your data and the rules you agree to when using the app.

Privacy Policy
--------------

### 1. Data We Collect
- **Iris Frames & Templates**: Five-frame bursts per eye are captured, fused, enhanced with the on-device QuickSRNet model, and converted into templates that stay on your device.
- **Authentication Logs**: Local summaries that help you review usage (time, status, confidence). No personal identifiers are attached.
- **Optional Hardware Metadata**: Bluetooth device names when pairing an external Raspberry Pi capture rig.
- **PIN Credentials**: A four-digit fallback PIN stored locally for secure actions.

We do **not** collect names, email addresses, raw iris images for long-term storage, analytics identifiers, or marketing data.

### 2. How Data Is Used
- **On-Device Processing**: Capture, quality scoring, fusion, super-resolution, and matching all run locally through ONNX Runtime. No network calls are made for biometric workflows.
- **Diagnostics**: Local logs power in-app tips and verification feedback.
- **Security Actions**: Your PIN authenticates sensitive flows like clearing templates.

### 3. Storage & Retention
- **Secure Storage**: Templates, PINs, and logs are stored with hardware-backed encryption (Secure Store).
- **Temporary Data**: Raw frames exist only in memory during enhancement and are discarded immediately after.
- **User Control**: You can delete templates, logs, and PINs from Settings or by uninstalling the app.

### 4. Your Rights
- **Consent**: Continuing to use the app confirms you consent to this policy. You may stop at any time.
- **Deletion**: Use Settings → Privacy to erase all biometric data instantly.
- **Transparency**: Review authentication logs and quality summaries directly in the app.

### 5. Security Measures
- **Encryption**: Hardware-backed Secure Store for templates, PINs, and session data.
- **Offline Guarantee**: No third-party APIs or cloud services are invoked.
- **Session Controls**: Sessions automatically expire to minimise residual access.

Terms of Use
------------

### 1. Acceptable Use
- For personal, single-user authentication scenarios.
- Do not scan individuals without explicit permission.
- Do not attempt to tamper with, reverse-engineer, or bypass app protections.

### 2. Responsibilities
- Maintain a device passcode and system updates.
- Keep your fallback PIN private.
- When pairing hardware over Bluetooth, ensure you trust the device you connect to.

### 3. Limitations
- Delivered “as is”; accuracy depends on factors like lighting, distance, and movement.
- Performance may vary with device processing power and camera quality.
- Optional Raspberry Pi integration is provided for convenience; we are not liable for third-party hardware issues.

### 4. Termination
You may stop using the app at any time by deleting your data and uninstalling. We may suspend access if you violate these terms.

Contact
-------
For privacy or support questions, please open an issue in the project repository.
