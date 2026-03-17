import os
from xrpl.clients import JsonRpcClient, WebsocketClient

_json_client: JsonRpcClient | None = None


def get_xrpl_client() -> JsonRpcClient:
    """Get a reusable JSON-RPC client for the XRPL testnet."""
    global _json_client
    if _json_client is None:
        network = os.environ.get("XRPL_NETWORK", "wss://s.altnet.rippletest.net:51233")
        # Convert wss to https for JSON-RPC
        rpc_url = network.replace("wss://", "https://").replace(":51233", ":51234")
        _json_client = JsonRpcClient(rpc_url)
    return _json_client


def get_xrpl_ws_url() -> str:
    return os.environ.get("XRPL_NETWORK", "wss://s.altnet.rippletest.net:51233")
