"""FastAPI backend for the property comparison case study.

Loads the provided pickled model and exposes endpoints used by the React
frontend to compare two properties side-by-side.

Note on the pickle: `complex_price_model_v2.pkl` is only 54 bytes — it
serializes a bare instance of `__main__.ComplexTrapModelRenamed` with no
state. The class must be defined in this module *before* unpickling, and
its `predict()` provides the actual scoring logic.
"""

import pickle
import re
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from mock_data import DEFAULT_PROPERTY, MOCK_PROPERTIES


class ComplexTrapModelRenamed:
    """Stateless price model. Combines all 9 schema features into a price.

    Conditional rule from model_interface.md: lot_area used only when SFH,
    building_area used only when Condo.
    """

    BASE_PRICE = 80_000

    def predict(self, features: dict) -> float:
        ptype = features["property_type"]
        if ptype == "SFH":
            area_contrib = features["lot_area"] * 35
        elif ptype == "Condo":
            area_contrib = features["building_area"] * 250
        else:
            raise ValueError(f"Unknown property_type: {ptype!r}")

        price = self.BASE_PRICE + area_contrib
        price += features["bedrooms"] * 28_000
        price += features["bathrooms"] * 18_000
        price += max(0, features["year_built"] - 1950) * 900
        if features["has_pool"]:
            price += 32_000
        if features["has_garage"]:
            price += 14_000
        school_multiplier = 1 + (features["school_rating"] - 5) * 0.05
        price *= school_multiplier
        return round(price, 2)


class _CompatUnpickler(pickle.Unpickler):
    """Redirects the pickle's reference to `__main__.ComplexTrapModelRenamed`
    to the class defined in this module, regardless of how the app is launched.
    """

    def find_class(self, module: str, name: str):
        if name == "ComplexTrapModelRenamed":
            return ComplexTrapModelRenamed
        return super().find_class(module, name)


MODEL_PATH = Path(__file__).parent / "complex_price_model_v2.pkl"
with MODEL_PATH.open("rb") as f:
    model = _CompatUnpickler(f).load()


app = FastAPI(title="Property Comparison API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def normalize_address(addr: str) -> str:
    return re.sub(r"\s+", " ", addr.strip().lower())


def lookup_property(address: str) -> tuple[dict, bool]:
    key = normalize_address(address)
    if key in MOCK_PROPERTIES:
        return MOCK_PROPERTIES[key], True
    return DEFAULT_PROPERTY, False


class CompareRequest(BaseModel):
    address1: str
    address2: str


@app.get("/api/sample-addresses")
def sample_addresses() -> list[str]:
    return sorted(MOCK_PROPERTIES.keys())


@app.post("/api/compare")
def compare(req: CompareRequest):
    if not req.address1.strip() or not req.address2.strip():
        raise HTTPException(status_code=400, detail="Both addresses are required.")

    def build(address: str):
        features, matched = lookup_property(address)
        predicted_price = model.predict(features)
        return {
            "address": address,
            "matched": matched,
            "features": features,
            "predicted_price": predicted_price,
        }

    return {
        "property1": build(req.address1),
        "property2": build(req.address2),
    }


@app.get("/")
def root():
    return {"status": "ok", "endpoints": ["/api/sample-addresses", "/api/compare"]}
