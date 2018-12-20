var modelisActive = true;

const sketch = function(p) {

  var model;
  var dx, dy; // offsets of the pen strokes, in pixels
  var pen_down, pen_up, pen_end; // keep track of whether pen is touching paper
  var x, y; // absolute coordinates on the screen of where the pen is
  var prev_pen = [1, 0, 0]; // group all p0, p1, p2 together
  var rnn_state; // store the hidden states of rnn's neurons
  var pdf; // store all the parameters of a mixture-density distribution
  var temperature = 0.45; // controls the amount of uncertainty of the model
  var line_color;
  var model_loaded = false;
  var screen_width, screen_height;

  const availableModels = ['bird', 'ant','ambulance','angel','alarm_clock','backpack','barn','basket','bear','bee','bicycle','book','brain','bridge','bulldozer','bus','butterfly','cactus','calendar','castle','cat','chair','couch','crab','cruise_ship','diving_board','dog','dolphin','duck','elephant','eye','face','fan','fire_hydrant','firetruck','flamingo','flower','frog','garden','hand','hedgeberry','hedgehog','helicopter','kangaroo','key','lantern','lighthouse','lion','lobster','map','mermaid','monkey','mosquito','octopus','owl','paintbrush','palm_tree','parrot','passport','peas','penguin','pig','pineapple','pool','postcard','rabbit','radio','rain','rhinoceros','rifle','roller_coaster','sandwich','scorpion','sea_turtle','sheep','skull','snail','snowflake','speedboat','spider','squirrel','steak','stove','strawberry','swan','swing_set','the_mona_lisa','tiger','toothbrush','toothpaste','tractor','trombone','truck','whale','windmill','yoga'];
  const BASE_URL = 'https://storage.googleapis.com/quickdraw-models/sketchRNN/models/';
  
  const randomModel = function () {
    model_loaded = false
    if (model) {
      model.dispose();
    } 
    const randomIndex = Math.floor(Math.random() * availableModels.length);
    model = new ms.SketchRNN(`${BASE_URL}${availableModels[randomIndex]}.gen.json`); 

    model.initialize().then(() => {
      model_loaded = true;
      // initialize the scale factor for the model. Bigger -> large outputs
      model.setPixelFactor(4.0);
      restart();
      console.log(`${availableModels[randomIndex]} loaded!`)
    });
  }

 
  var clear_screen = function() {
    p.background(255, 255, 255, 255);
    p.fill(255, 255, 255, 255);
  };

  var restart = function() {
    // initialize pen's states to zero.
    [dx, dy, pen_down, pen_up, pen_end] = model.zeroInput(); // the pen's states

    // zero out the rnn's initial states
    rnn_state = model.zeroState();

    clear_screen();

  }

  p.restart = function() {

    clear_screen();

    randomModel();

    modelisActive = true;

  }

  p.setup = function() {
    screen_width = p.windowWidth; //window.innerWidth
    screen_height = p.windowHeight; //window.innerHeight
    x = screen_width/4.0;
    y = screen_height/4.0;
    p.createCanvas(screen_width / 2 , screen_height * 0.5);
    p.frameRate(60);
    randomModel();
    restart();

    // define color of line
    line_color = p.color(p.random(64, 224), p.random(64, 224), p.random(64, 224));
  };

  p.draw = function() {
    if (!model_loaded || !modelisActive) {
      return;
    }
    // see if we finished drawing
    if (prev_pen[2] == 1) {
      //p.noLoop(); // stop drawing
      //return
      //restart();
      
      //initialize pen's states to zero.
      [dx, dy, pen_down, pen_up, pen_end] = model.zeroInput(); // the pen's states

      // zero out the rnn's initial states
      rnn_state = model.zeroState();

      x = screen_width/4.0;
      y = screen_height/4.0;
      line_color = p.color(p.random(64, 224), p.random(64, 224), p.random(64, 224));
      modelisActive = false;
    }

    // using the previous pen states, and hidden state, get next hidden state
    // the below line takes the most CPU power, especially for large models.
    rnn_state = model.update([dx, dy, pen_down, pen_up, pen_end], rnn_state);

    // get the parameters of the probability distribution (pdf) from hidden state
    pdf = model.getPDF(rnn_state, temperature);

    // sample the next pen's states from our probability distribution
    [dx, dy, pen_down, pen_up, pen_end] = model.sample(pdf);

    // only draw on the paper if the pen is touching the paper
    if (prev_pen[0] == 1) {
      p.stroke(line_color);
      p.strokeWeight(3.0);
      p.line(x, y, x+dx, y+dy); // draw line connecting prev point to current point.
    }

    // update the absolute coordinates from the offsets
    x += dx;
    y += dy;

    // update the previous pen's state to the current one we just sampled
    prev_pen = [pen_down, pen_up, pen_end];
  };

};

document.querySelector('#draw-btn').addEventListener('click', () => {
  console.log('clicked!');
  p5Sketch.restart();
});

const p5Sketch = new p5(sketch, 'sketch');