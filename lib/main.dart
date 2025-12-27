
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:permission_handler/permission_handler.dart';

void main() {
  runApp(
    const MaterialApp(
      home: WebViewApp(),
      debugShowCheckedModeBanner: false, // Disables the debug banner
    ),
  );
}

class WebViewApp extends StatefulWidget {
  const WebViewApp({Key? key}) : super(key: key);

  @override
  State<WebViewApp> createState() => _WebViewAppState();
}

class _WebViewAppState extends State<WebViewApp> {
  final Completer<WebViewController> _controller = Completer<WebViewController>();
  bool _isLoading = true; // To track loading state for the splash screen

  @override
  void initState() {
    super.initState();
    // Enable virtual display.
    // WebView.platform = SurfaceAndroidWebView(); // This line is now deprecated, no longer needed.
    _requestPermissions();
  }

  Future<void> _requestPermissions() async {
    // Request necessary permissions here, e.g., for file picking or camera
    await Permission.camera.request();
    await Permission.storage.request();
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            WebView(
              initialUrl: 'https://ludo-league.vercel.app', // The main URL of your Next.js app
              javascriptMode: JavascriptMode.unrestricted,
              onWebViewCreated: (WebViewController webViewController) {
                _controller.complete(webViewController);
              },
              onPageFinished: (String url) {
                 setState(() {
                  _isLoading = false;
                });
              },
              navigationDelegate: (NavigationRequest request) async {
                final Uri uri = Uri.parse(request.url);

                // Prevent all external navigation and open in browser instead
                if (!uri.host.contains('ludo-league.vercel.app')) {
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                    return NavigationDecision.prevent; // Prevent navigation in WebView
                  }
                }

                return NavigationDecision.navigate; // Allow navigation within the app
              },
              // Add support for file uploads
              javascriptChannels: <JavascriptChannel>{
                _createFilePickerChannel(context),
              },
            ),
            if (_isLoading)
              Container(
                color: Colors.white, // Or your app's background color
                child: Center(
                  // Using your logo as a splash screen
                  child: Image.asset('assets/logo.png', width: 150, height: 150),
                ),
              ),
          ],
        ),
      ),
    );
  }

  // This channel is a placeholder for a file picker implementation.
  // A full implementation requires platform-specific code (or a plugin).
  JavascriptChannel _createFilePickerChannel(BuildContext context) {
    return JavascriptChannel(
        name: 'FlutterFilePicker',
        onMessageReceived: (JavascriptMessage message) async {
          // This is where you would trigger the file picker.
          // For example, using the file_picker package.
          // final result = await FilePicker.platform.pickFiles();
          // if (result != null) {
          //   // Handle the selected file
          // }
        });
  }
}
