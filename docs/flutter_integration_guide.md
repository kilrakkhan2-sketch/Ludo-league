
# LudoLeague: Flutter WebView ऐप इंटीग्रेशन गाइड

यह गाइड आपको अपने LudoLeague Next.js एप्लिकेशन को Google Play Store पर प्रकाशन के लिए एक Flutter ऐप में सफलतापूर्वक रैप करने में मदद करेगी।

---

### चरण 1: Flutter प्रोजेक्ट सेटअप

शुरू करने के लिए, अपने कंप्यूटर पर एक नया Flutter प्रोजेक्ट बनाएं।

1.  **एक नया Flutter प्रोजेक्ट बनाएं:**
    ```sh
    flutter create ludo_league_app
    cd ludo_league_app
    ```

2.  **निर्भरताएँ (Dependencies) जोड़ें:**
    अपने Flutter प्रोजेक्ट की `pubspec.yaml` फ़ाइल खोलें और `dependencies:` सेक्शन के अंतर्गत निम्नलिखित लाइनें जोड़ें:
    ```yaml
    dependencies:
      flutter:
        sdk: flutter
      webview_flutter: ^4.7.0
      url_launcher: ^6.3.0
    ```

3.  **पैकेज इंस्टॉल करें:**
    अपने प्रोजेक्ट डायरेक्टरी में टर्मिनल खोलें और चलाएँ:
    ```sh
    flutter pub get
    ```

---

### चरण 2: मुख्य Flutter ऐप कोड (`lib/main.dart`)

अपने Flutter प्रोजेक्ट में `lib/main.dart` फ़ाइल की पूरी सामग्री को निम्नलिखित कोड से बदलें। यह कोड आपके वेब ऐप को लोड करने और उसे नियंत्रित करने के लिए आवश्यक है।

```dart
import 'dart:async';
import 'package.flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

// महत्वपूर्ण: इस URL को अपने प्रकाशित वेब ऐप के URL से बदलें
const String appUrl = 'https://your-live-app-url.com'; // <-- अपना लाइव URL यहाँ डालें

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LudoLeague',
      debugShowCheckedModeBanner: false, // रिलीज़ के लिए इसे false रखें
      theme: ThemeData(
        primarySwatch: Colors.green,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: const WebViewScreen(),
    );
  }
}

class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _isError = false;

  @override
  void initState() {
    super.initState();

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0F3D36)) // आपके ऐप के बैकग्राउंड से मेल खाता है
      ..setUserAgent('LudoLeagueApp/1.0.0 (Android; Flutter)') // वेब ऐप को पहचानने के लिए कस्टम एजेंट
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
              _isError = false;
            });
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
          },
          onWebResourceError: (WebResourceError error) {
            setState(() {
              _isLoading = false;
              _isError = true;
            });
          },
          onNavigationRequest: (NavigationRequest request) {
            // यदि लिंक आपके ऐप का नहीं है, तो उसे बाहरी ब्राउज़र में खोलें
            if (!request.url.startsWith(appUrl)) {
              _launchUrl(request.url);
              return NavigationDecision.prevent; // ऐप के अंदर नेविगेट करने से रोकें
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(appUrl));
  }

  // बाहरी URL लॉन्च करने के लिए हेल्पर फ़ंक्शन
  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  // मूल बैक बटन को संभालने के लिए
  Future<bool> _onWillPop() async {
    if (await _controller.canGoBack()) {
      _controller.goBack();
      return false; // ऐप को बंद न करें
    }
    return true; // यदि पीछे नहीं जा सकते तो ऐप को बंद करें
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        backgroundColor: const Color(0xFF0F3D36),
        body: SafeArea(
          child: Stack(
            children: [
              WebViewWidget(controller: _controller),
              
              // लोडिंग इंडिकेटर
              if (_isLoading)
                const Center(
                  child: CircularProgressIndicator(
                    color: Color(0xFFD4AF37), // गोल्ड एक्सेंट
                  ),
                ),

              // त्रुटि स्क्रीन
              if (_isError)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.cloud_off, color: Colors.white70, size: 60),
                        const SizedBox(height: 20),
                        const Text(
                          'Connection Error',
                          style: TextStyle(fontSize: 22, color: Colors.white, fontWeight: FontWeight.bold),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'Please check your internet connection and try again.',
                          style: TextStyle(fontSize: 16, color: Colors.white70),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 30),
                        ElevatedButton(
                          onPressed: () {
                            setState(() {
                              _isLoading = true;
                              _isError = false;
                            });
                            _controller.reload();
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFD4AF37),
                            foregroundColor: const Color(0xFF062420),
                          ),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
```

---

### चरण 3: एंड्रॉइड कॉन्फ़िगरेशन

1.  **इंटरनेट अनुमति जोड़ें:**
    `android/app/src/main/AndroidManifest.xml` फ़ाइल खोलें और `<application>` टैग से ठीक पहले यह लाइन जोड़ें:
    ```xml
    <uses-permission android:name="android.permission.INTERNET" />
    ```

2.  **SDK संस्करण सेट करें:**
    `android/app/src/main/build.gradle` फ़ाइल खोलें। `defaultConfig` ब्लॉक के अंदर, `minSdkVersion` को कम से कम `21` पर सेट करें।
    ```groovy
    android {
        // ...
        defaultConfig {
            // ...
            minSdkVersion 21
            // ...
        }
        // ...
    }
    ```

---

### चरण 4: ऐप बनाना और प्रकाशित करना

1.  **ऐप आइकन बदलें:** अपने Flutter प्रोजेक्ट में डिफ़ॉल्ट आइकन को अपने `LudoLeague` आइकन से बदलें।
2.  **रिलीज़ बिल्ड बनाएं:** अपने टर्मिनल में चलाएँ:
    ```sh
    flutter build appbundle --release
    ```
3.  **प्रकाशित करें:** Google Play Console पर जाएँ, एक नया ऐप बनाएं, और `build/app/outputs/bundle/release/app-release.aab` पर स्थित ऐप बंडल को अपलोड करें।

इन चरणों का पालन करने के बाद, आपका वेब ऐप एक पूर्ण एंड्रॉइड ऐप के रूप में प्रकाशित होने के लिए तैयार हो जाएगा।
