// Options Page JavaScript

import { aiService } from "../ai/ai-service";
import type { AIModelConfig } from "../ai/types";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Options page loaded");

  // Get DOM elements
  const providerSelect = document.getElementById(
    "ai-provider",
  ) as HTMLSelectElement;
  const apiKeyInput = document.getElementById(
    "gemini-api-key",
  ) as HTMLInputElement;
  const modelSelect = document.getElementById(
    "model-name",
  ) as HTMLSelectElement;
  const temperatureSlider = document.getElementById(
    "temperature",
  ) as HTMLInputElement;
  const temperatureValue = document.getElementById(
    "temperature-value",
  ) as HTMLSpanElement;
  const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
  const testBtn = document.getElementById("test-btn") as HTMLButtonElement;
  const statusMessage = document.getElementById(
    "status-message",
  ) as HTMLDivElement;
  const apiStatus = document.getElementById("api-status") as HTMLSpanElement;

  // Load saved configuration
  await loadConfiguration();

  // Temperature slider handler
  temperatureSlider.addEventListener("input", () => {
    temperatureValue.textContent = temperatureSlider.value;
  });

  // Save button handler
  saveBtn.addEventListener("click", async () => {
    await saveConfiguration();
  });

  // Test button handler
  testBtn.addEventListener("click", async () => {
    await testConnection();
  });

  /**
   * Load saved configuration from storage
   */
  async function loadConfiguration(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(["aiConfig"]);

      if (result.aiConfig) {
        const config = result.aiConfig as AIModelConfig;
        providerSelect.value = config.provider;
        apiKeyInput.value = config.apiKey || "";
        modelSelect.value = config.modelName;
        temperatureSlider.value = (config.temperature || 0.7).toString();
        temperatureValue.textContent = temperatureSlider.value;

        // Update status if API key exists
        if (config.apiKey) {
          apiStatus.textContent = "Configured";
          apiStatus.classList.add("ready");
        }
      }
    } catch (error) {
      console.error("Error loading configuration:", error);
    }
  }

  /**
   * Save configuration to storage
   */
  async function saveConfiguration(): Promise<void> {
    try {
      const config: AIModelConfig = {
        provider: providerSelect.value as "gemini" | "openai" | "anthropic",
        modelName: modelSelect.value,
        apiKey: apiKeyInput.value.trim(),
        temperature: parseFloat(temperatureSlider.value),
        maxTokens: 8192, // Increased to prevent truncation
      };

      if (!config.apiKey) {
        showStatus("Please enter an API key", "error");
        return;
      }

      // Save to storage
      await chrome.storage.local.set({ aiConfig: config });

      // Try to initialize AI service
      try {
        await aiService.initialize(config);
        showStatus("Configuration saved successfully!", "success");
        apiStatus.textContent = "Ready";
        apiStatus.classList.add("ready");
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to validate API key";
        showStatus(
          `Configuration saved, but validation failed: ${errorMsg}`,
          "error",
        );
        apiStatus.textContent = "Invalid Key";
        apiStatus.classList.remove("ready");
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      showStatus("Failed to save configuration", "error");
    }
  }

  /**
   * Test API connection
   */
  async function testConnection(): Promise<void> {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showStatus("Please enter an API key first", "error");
      return;
    }

    testBtn.disabled = true;
    testBtn.textContent = "Testing...";

    try {
      const config: AIModelConfig = {
        provider: providerSelect.value as "gemini",
        modelName: modelSelect.value,
        apiKey: apiKey,
        temperature: parseFloat(temperatureSlider.value),
      };

      await aiService.initialize(config);
      showStatus("API connection successful!", "success");
      apiStatus.textContent = "Connected";
      apiStatus.classList.add("ready");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Connection failed";
      showStatus(`${errorMsg}`, "error");
      apiStatus.textContent = "Connection Failed";
      apiStatus.classList.remove("ready");
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = "Test API Connection";
    }
  }

  /**
   * Show status message
   */
  function showStatus(message: string, type: "success" | "error"): void {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;

    // Auto-hide after 5 seconds
    setTimeout(() => {
      statusMessage.classList.add("hidden");
    }, 5000);
  }
});
