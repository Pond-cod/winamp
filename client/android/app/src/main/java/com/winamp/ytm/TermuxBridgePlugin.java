package com.winamp.ytm;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PluginCall;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * TermuxBridgePlugin allows the React/Webamp frontend to explicitly
 * start or stop the Termux backend service (e.g. on File -> Exit or Manual Restart).
 */
@CapacitorPlugin(name = "TermuxBridge")
public class TermuxBridgePlugin extends Plugin {

    @PluginMethod
    public void startBackend(PluginCall call) {
        MainActivity.startBackendStatic(getContext());
        JSObject ret = new JSObject();
        ret.put("status", "starting");
        call.resolve(ret);
    }

    @PluginMethod
    public void stopBackend(PluginCall call) {
        MainActivity.stopBackendStatic(getContext());
        JSObject ret = new JSObject();
        ret.put("status", "stopping");
        call.resolve(ret);
    }
}
