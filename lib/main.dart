
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ludo League',
      debugShowCheckedModeBanner: false, // उत्पादन के लिए इसे false पर सेट करें
      theme: ThemeData(
        primarySwatch: Colors.blue,
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
  // इस URL को अपने प्रकाशित Next.js ऐप के URL से बदलें
  final String _initialUrl = 'https://your-nextjs-app-url.com'; 
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();

    // WebView Controller को इनिशियलाइज़ करें
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted) // JavaScript को सक्षम करें
      ..setUserAgent('LudoLeagueApp/1.0.0 (Android; Flutter)') // कस्टम User-Agent सेट करें
      ..setBackgroundColor(const Color(0x00000000)) // पारदर्शी पृष्ठभूमि
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            // आप चाहें तो यहाँ एक लोडिंग इंडिकेटर दिखा सकते हैं
          },
          onPageStarted: (String url) {
            // पेज लोड होना शुरू हो गया है
          },
          onPageFinished: (String url) {
            // पेज लोड हो गया है
          },
          onWebResourceError: (WebResourceError error) {
            // वेब संसाधन लोड करने में त्रुटि
            debugPrint('''
              Page resource error:
              code: ${error.errorCode}
              description: ${error.description}
              errorType: ${error.errorType}
              isForMainFrame: ${error.isForMainFrame}
            ''');
          },
          onNavigationRequest: (NavigationRequest request) async {
            // तय करें कि किन URLs को WebView के भीतर नेविगेट करना है और किनको बाहर खोलना है
            final Uri uri = Uri.parse(request.url);

            // बाहरी लिंक (जैसे फेसबुक, गूगल, या कोई अन्य डोमेन) को डिफ़ॉल्ट ब्राउज़र में खोलें
            if (!uri.host.contains('your-nextjs-app-url.com')) { // <-- यहाँ अपना डोमेन डालें
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              }
              return NavigationDecision.prevent; // WebView में नेविगेशन को रोकें
            }
            
            // ऐप के भीतर नेविगेट करें
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(_initialUrl));
  }

  // यह पॉपस्कोप सुनिश्चित करता है कि एंड्रॉइड बैक बटन सही तरीके से काम करता है
  Future<bool> _onWillPop() async {
    if (await _controller.canGoBack()) {
      _controller.goBack();
      return false; // ऐप को बंद न करें
    }
    return true; // ऐप को बंद करें क्योंकि कोई पिछला पृष्ठ नहीं है
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false, // हम _onWillPop के साथ पॉप को मैन्युअल रूप से संभालेंगे
      onPopInvoked: (bool didPop) async {
        if (didPop) {
          return;
        }
        final bool shouldPop = await _onWillPop();
        if (shouldPop && context.mounted) {
          Navigator.pop(context);
        }
      },
      child: Scaffold(
        body: SafeArea(
          child: WebViewWidget(controller: _controller),
        ),
      ),
    );
  }
}

